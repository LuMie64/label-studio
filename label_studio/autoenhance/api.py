import logging
import json
import os

from urllib.parse import unquote
import replicate
from PIL import Image

from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .functions import has_replicate_key, has_internet_connection, get_maxim_image_base, resize_image, test_repliacte_url
from .models import EnhancedImageModel

from label_studio.core.settings.label_studio import BASE_DATA_DIR

logger = logging.getLogger(__name__)

# ToDos: Adjust fetching of original image, make secure, prefetch image if existing token seems to not connect to a user

ENHANCEMENT_TYPE_MAPPER = {
    "Deblurring": "Image Deblurring (RealBlur_J)",
    "Denoising": "Image Denoising",
    "Deraining (Streak)": "Image Deraining (Rain streak)",
    "Deraining (drops)": "Image Deraining (Rain drop)",
    "Dehazing Indoor": "Image Dehazing Indoor",
    "Dehazing Outdoor": "Image Dehazing Outdoor",
    "Enhancement (Low-light)": "Image Enhancement (Low-light)",
    "Enhancement (Retouching)": "Image Enhancement (Retouching)"
}

class AutoEnhanceAPI(views.APIView):

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        if not has_internet_connection():
            logger.error('Cannot connect to MAXIM due to bad internet connection')
            return Response({'connection_status': 'Please Connect to the internt'}, status=status.HTTP_502_BAD_GATEWAY)
        if not has_replicate_key():
            logger.error('Cannot connect to MAXIM due to Missing replicate Key')
            return Response({'connection_status': 'Please set a replicate Token'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({'connection_status': 'Connection Possible'}, status=status.HTTP_200_OK)
            
    def post(self, request):

        payload = json.loads(request.body)

        url_path, img_src = unquote(payload.get('src')).split('data/')

        enhancement_model =  ENHANCEMENT_TYPE_MAPPER.get(payload.get('enhancementModel'), "Image Deblurring (GoPro)")

        try:
            enhanced_image = EnhancedImageModel.objects.get(original_src=img_src, enhancement_model=enhancement_model)
            model_exists = True
        except EnhancedImageModel.DoesNotExist:
            enhanced_image = EnhancedImageModel(original_src=img_src, enhancement_model=enhancement_model)
            model_exists = False

        if model_exists:
            if test_repliacte_url(enhanced_image.enhanced_src_url, request):
                return Response({'enhanced_image_str': enhanced_image.enhanced_src, 
                                'new_img_url': enhanced_image.enhanced_src_url},
                                status=status.HTTP_200_OK)

        original_img_path = BASE_DATA_DIR + '/media/' + img_src
        file_name, img_type = os.path.splitext(original_img_path)

        adjusted_img_path = file_name + '_temp' + img_type # could actually be tempfile, recheck
              
        try:
            if img_type == '.png':
                img = Image.open(original_img_path)
                img.save(adjusted_img_path, optimize=True)
            elif img_type in ['.jpg', '.jpeg']:
                resize_image(original_img_path, adjusted_img_path, 100000)
            else:
                return Response({'Error': 'weird image path'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'Error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        maxim_input = {
            "image": open(adjusted_img_path, 'rb'),
            "model": enhancement_model
        }     

        try:
            output = replicate.run(
                "google-research/maxim:494ca4d578293b4b93945115601b6a38190519da18467556ca223d219c3af9f9",
                maxim_input
            )

        except Exception as e:
            logger.error(f'Failure on connecting to maxim: {str(e)}')
            return Response({'Error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
  
        enhanced_src = get_maxim_image_base(output, img_type)
        
        enhanced_image.enhanced_src=enhanced_src
        
        enhanced_image.save(user=request.user, file_name=adjusted_img_path.split('/')[-1], url_path=url_path)
        
        return Response({'enhanced_image_str': enhanced_src, 'new_img_url': output}, status=status.HTTP_200_OK)
