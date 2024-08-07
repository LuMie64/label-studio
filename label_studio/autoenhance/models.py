import re
import base64

from django.db import models
from django.core.files.base import ContentFile

from data_import.models import FileUpload
from projects.models import Project

from label_studio.core.settings.label_studio import BASE_DATA_DIR


class EnhancedImageModel(models.Model):
    original_src = models.CharField(max_length=255)
    enhanced_src = models.TextField()
    enhanced_src_url = models.CharField(max_length=255)
    enhancement_model = models.CharField(max_length=50)

    def save(self, *args, **kwargs):  
        if self._state.adding:  
            file_upload = FileUpload.objects.create(
                user=kwargs.pop('user'),
                project = Project.objects.get(id=self.__find_project_id(self.original_src)),
                file = ContentFile(base64.b64decode(self.enhanced_src), name=kwargs.pop('file_name'))
            )            
            url_path = kwargs.pop('url_path')
            self.enhanced_src_url = f'{url_path}data/{file_upload.filepath}'
            self.__save_image_to_file(file_upload.filepath)
        super(EnhancedImageModel, self).save(*args, **kwargs)

    def __find_project_id(self, input_url):
        re_string = r'/(\d+)/'
        match = re.search(re_string, input_url)
        if match:
            return match.group(1)
        else:
            return ''

    def __save_image_to_file(self, relative_file_upload_path):
        img_data = base64.b64decode(self.enhanced_src)
        with open(f'{BASE_DATA_DIR}/media/{relative_file_upload_path}', 'wb') as f:
            f.write(img_data)
        