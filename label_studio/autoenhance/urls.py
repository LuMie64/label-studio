from django.urls import include, path

from . import api

app_name = 'autoenhance'

_api_urlpatterns_templates = [
    path('', api.AutoEnhanceAPI.as_view(), name='autoenhance'),
]


urlpatterns = [
    path('api/autoenhance/', include((_api_urlpatterns_templates, app_name), namespace='api-autoenhance')),
]
