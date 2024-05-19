import environ
import os
import tempfile
import requests
import base64

from io import BytesIO

import numpy as np
from PIL import Image # ToDo: add to requirements

from core.settings.base import BASE_DATA_DIR

def has_replicate_key():
    env_key = 'REPLICATE_API_TOKEN' 
    env = environ.Env()
    env_filepath = os.path.join(BASE_DATA_DIR, '.env')
    environ.Env.read_env(env_filepath)

#    return bool(env.str(env_key, ''))
    return True

def has_internet_connection():
    try:
        response = requests.get('https://labelstud.io/', timeout=10)
    except Exception as e:
        print(str(e))
        return False 

    return response.status_code == 200

def get_maxim_image_base(img_url, img_type):
    response = requests.get(img_url)
    if response.status_code == 200:
        image = Image.open(BytesIO(response.content))
        buffered = BytesIO()
        image.save(buffered, img_type[1:])
        img_str = base64.b64encode(buffered.getvalue())

        return img_str
    