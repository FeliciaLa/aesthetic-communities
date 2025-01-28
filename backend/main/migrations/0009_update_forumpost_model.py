from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('main', '0008_resourcecategory_views_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='forumpost',
            name='title',
        ),
        migrations.AddField(
            model_name='forumpost',
            name='media',
            field=models.FileField(blank=True, null=True, upload_to='forum_media/'),
        ),
        migrations.AddField(
            model_name='forumpost',
            name='media_type',
            field=models.CharField(
                choices=[('image', 'Image'), ('video', 'Video'), ('none', 'None')],
                default='none',
                max_length=10
            ),
        ),
        migrations.AddField(
            model_name='forumpost',
            name='likes',
            field=models.ManyToManyField(
                blank=True,
                related_name='liked_posts',
                to='auth.user'
            ),
        ),
    ] 