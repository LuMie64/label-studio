import environ
import requests

from core.settings.base import BASE_DATA_DIR

def has_replicate_key():
    env_key = 'REPLICATE_API_TOKEN' 
    env = environ.Env()
    env_filepath = os.path.join(BASE_DATA_DIR, '.env')
    environ.Env.read_env(env_filepath)

    return env.str(env_key, '') is not None

def has_internet_connection():
    try:
        response = request.get('https://labelstud.io/', timeout=10)
    except Exception as e:
        return False 

    return response.status_code == 200

        