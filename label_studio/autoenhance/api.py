import logging

from rest_framework import status, views
from rest_framework.response import Response

from .functions import has_replicate_key, has_internet_connection

logger = logging.getLogger(__name__)

class AutoEnhanceAPI(views.APIView):

    permission_required = None # ToDo

    def get(self, request):
        if not has_internet_connection():
            logger.error('Cannot connect to MAXIM due to bad internet connection')
            return Response({'connection_staus': 'Please Connect to the internt'}, status=status.HTTP_502_BAD_GATEWAY)
        if not has_replicate_key():
            logger.error('Cannot connect to MAXIM due to Missing replicate Key')
            return Response({'connection_staus': 'Please set a replicate Token'}, status=status.HTTP_401_UNAUTHORIZED)
        return Response({'connection_staus': 'Connection Possible'}, status=status.HTTP_200_OK)
            
    def post(self, request):
        return request.data


