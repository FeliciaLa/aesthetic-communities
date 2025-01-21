from django.db import migrations, models
import django.db.models.deletion

def set_default_category_type(apps, schema_editor):
    ResourceCategory = apps.get_model('main', 'ResourceCategory')
    for category in ResourceCategory.objects.all():
        category.category_type = 'OTHER'
        category.save()

class Migration(migrations.Migration):

    dependencies = [
        ('main', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='resourcecategory',
            name='category_type',
            field=models.CharField(
                choices=[
                    ('MOVIES', 'Movies'),
                    ('BOOKS', 'Books'),
                    ('VIDEOS', 'Videos'),
                    ('MUSIC', 'Music'),
                    ('TUTORIALS', 'Tutorials'),
                    ('OTHER', 'Other')
                ],
                default='OTHER',
                max_length=20
            ),
        ),
        migrations.RunPython(set_default_category_type),
    ] 