from django.db import migrations

class Migration(migrations.Migration):
    dependencies = [
        ('main', '0002_resourcecategory_preview_image'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='resourcecategory',
            name='category_type',
        ),
    ] 