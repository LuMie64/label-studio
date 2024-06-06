import logging
import json
import base64
import os

from urllib.parse import unquote
import replicate
from PIL import Image

from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .functions import has_replicate_key, has_internet_connection, get_maxim_image_base, resize_image, test_repliacte_url
from .models import EnhancedImageModel

from label_studio.core.settings.label_studio import BASE_DATA_DIR



logger = logging.getLogger(__name__)

class AutoEnhanceAPI(views.APIView):

    #permission_required = None # ToDo

    def get(self, request):
        if not has_internet_connection():
            logger.error('Cannot connect to MAXIM due to bad internet connection')
            return Response({'connection_status': 'Please Connect to the internt'}, status=status.HTTP_502_BAD_GATEWAY)
        if not has_replicate_key():
            logger.error('Cannot connect to MAXIM due to Missing replicate Key')
            return Response({'connection_status': 'Please set a replicate Token'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({'connection_status': 'Connection Possible'}, status=status.HTTP_200_OK)
            
    def post(self, request):

        token = Token.objects.get(user=request.user)

        dict_object = json.loads(request.body)

        url_path, img_src = unquote(dict_object.get('src')).split('data/')
       
        enhanced_image, created = EnhancedImageModel.objects.get_or_create(original_src=img_src)

        if not created:
            if test_repliacte_url(enhanced_image.enhanced_src_url, str(token)):
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
    
        print(f"original file size: {os.path.getsize(original_img_path)} new file: {os.path.getsize(adjusted_img_path)}")

        maxim_input = {
            "image": open(adjusted_img_path, 'rb'),
            "model": "Image Deblurring (GoPro)"
        }     

        try:
            output = replicate.run(
                "google-research/maxim:494ca4d578293b4b93945115601b6a38190519da18467556ca223d219c3af9f9",
                maxim_input
            )

        except Exception as e:
            logger.error(f'Failure on connecting to maxim: {str(e)}')
            return Response({'Error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        enhanced_src, saved = get_maxim_image_base(output, img_type, adjusted_img_path)
        
        enhanced_image.enhanced_src=enhanced_src
        if saved:
            enhanced_image.enhanced_src_url=f'{url_path}data/{img_src[:-len(img_type)]}_temp{img_type}'
        else:
            enhanced_image.enhanced_src_url=output
        
        enhanced_image.save()
        
        return Response({'enhanced_image_str': enhanced_src, 'new_img_url': output}, status=status.HTTP_200_OK)
