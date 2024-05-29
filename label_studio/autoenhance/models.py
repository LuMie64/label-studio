from django.db import models

class EnhancedImageModel(models.Model):
    original_src = models.CharField(max_length=255)
    enhanced_src = models.TextField()
    enhanced_src_url = models.CharField(max_length=255)
