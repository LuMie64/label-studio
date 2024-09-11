import environ
import os
import io
import requests
import base64

from PIL import Image 

from rest_framework.test import APIRequestFactory

from core.settings.base import BASE_DATA_DIR
from label_studio.core.settings.label_studio import SECRET_KEY
from data_import.api import UploadedFileResponse


def has_replicate_key():
    env_key = 'REPLICATE_API_TOKEN' 
    env = environ.Env()
    env_filepath = os.path.join(BASE_DATA_DIR, '.env')
    environ.Env.read_env(env_filepath)

    return bool(env.str(env_key, ''))


def has_internet_connection():
    try:
        response = requests.get('https://labelstud.io/', timeout=10)
    except Exception as e:
        print(str(e))
        return False 

    return response.status_code == 200

def resize_image(input_path, output_path, max_size, max_dimensions=(600,800)):

    image = Image.open(input_path)
    
    image.thumbnail(max_dimensions, Image.Resampling.LANCZOS)
    
    # Reduce image size
    quality = 95
    while True:
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=quality, progressive=True)
        size = buffer.tell()
        
        if size <= max_size or quality <= 10:
            break

#        assert quality <= 10, 'Image is to large, please reduce size before using autoenhance'
            
        quality -= 5

    with open(output_path, 'wb') as f:
        f.write(buffer.getvalue())


def get_maxim_image_base(img_url, img_type):
    response = requests.get(img_url)
    if response.status_code == 200:
        image = Image.open(io.BytesIO(response.content))
        buffered = io.BytesIO()
        if img_type == '.jpg':
            img_type = '.jpeg'
        image.save(buffered, img_type[1:])
        img_str = base64.b64encode(buffered.getvalue())

        return img_str

        
def test_repliacte_url(img_url, request):
    if img_url:
        if not 'replicate' in img_url:
            _, file_name = img_url.split('upload/')

            factory = APIRequestFactory()
            new_request = factory.get(request.path, request.GET)
            
            new_request.user = request.user
            new_request.session = request.session

            view = UploadedFileResponse.as_view()

            response = view(new_request, filename=file_name)

        else:
            response = requests.get(img_url)
        return response.status_code == 200
    else:
        return False
                        