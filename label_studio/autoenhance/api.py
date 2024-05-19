import logging
import json
import base64
import os

from urllib.parse import unquote
from replicate.client import Client # add to requirements

from rest_framework import status, views
from rest_framework.response import Response

from .functions import has_replicate_key, has_internet_connection, get_maxim_image_base
from label_studio.core.settings.label_studio import SECRET_KEY, BASE_DATA_DIR

from PIL import Image
from io import BytesIO

logger = logging.getLogger(__name__)

class AutoEnhanceAPI(views.APIView):

    #permission_required = None # ToDo

    def get(self, request):
        if not has_internet_connection():
            logger.error('Cannot connect to MAXIM due to bad internet connection')
            return Response({'connection_staus': 'Please Connect to the internt'}, status=status.HTTP_502_BAD_GATEWAY)
        if not has_replicate_key():
            logger.error('Cannot connect to MAXIM due to Missing replicate Key')
            return Response({'connection_staus': 'Please set a replicate Token'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({'connection_staus': 'Connection Possible'}, status=status.HTTP_200_OK)
            
    def post(self, request):
        file = request.FILES['file']
        content_bytes = file.read()
        dict_object = json.loads(content_bytes.decode('utf-8'))

        _, img_src = unquote(dict_object.get('src')).split('data/')

        original_img_path = BASE_DATA_DIR + '/media/' + img_src
        file_name, img_type = os.path.splitext(original_img_path)

        adjusted_img_path = file_name + '_temp' + img_type # could actually be tempfile, recheck
        
        print(original_img_path)
        print(img_type)
      
        img = Image.open(original_img_path)

        if img_type == '.png':
            img.save(adjusted_img_path, optimize=True)
        elif img_type in ['.jpg', '.jpeg']:
            img.save(adjusted_img_path, quality='web_medium')
        else:
            return Response({'Error': 'weird image path'})
    
        print(f"original file size: {os.path.getsize(original_img_path)} new file: {os.path.getsize(adjusted_img_path)}")

        replicate = Client(api_token='r8_a0AauDPpAK9eRVDEjlgrk3TIgn1juLV3hsg1B')

        maxim_input = {
            "image": open(adjusted_img_path, 'rb'),
            "model": "Image Enhancement (Retouching)"
        }     

        print(maxim_input)

        try:
            ouput = replicate.run(
                "google-research/maxim:494ca4d578293b4b93945115601b6a38190519da18467556ca223d219c3af9f9",
                maxim_input
            )

        except Exception as e:
            logger.error(f'Failure on connecting to maxim: {str(e)}')
            return Response({'Error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({'enhanced_image_str': get_maxim_image_base(ouput, img_type), 'new_img_url': ouput}, status=status.HTTP_200_OK)

