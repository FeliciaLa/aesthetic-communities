from django.db import models
from django.contrib.auth.models import User
from django.conf import settings

class Community(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    members = models.ManyToManyField(User, related_name='communities')
    banner_image = models.ImageField(upload_to='community_banners/', null=True, blank=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Communities"

class ResourceCategory(models.Model):
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    community = models.ForeignKey('Community', on_delete=models.CASCADE)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    views = models.IntegerField(default=0)
    preview_image = models.ImageField(upload_to='category_previews/', null=True, blank=True)
    is_preset = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class Resource(models.Model):
    title = models.CharField(max_length=200)
    url = models.URLField()
    remark = models.TextField(null=True, blank=True)
    category = models.ForeignKey('ResourceCategory', on_delete=models.CASCADE)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    views = models.IntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class ForumPost(models.Model):
    content = models.TextField(blank=True)
    media = models.FileField(upload_to='forum_media/', null=True, blank=True)
    media_type = models.CharField(
        max_length=10,
        choices=[('image', 'Image'), ('video', 'Video'), ('none', 'None')],
        default='none'
    )
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='forum_posts')
    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User, related_name='liked_posts', blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.created_by.username}'s post in {self.community.name}"

class ForumComment(models.Model):
    content = models.TextField()
    post = models.ForeignKey(ForumPost, on_delete=models.CASCADE, related_name='comments')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.created_by.username} on {self.post.content[:50]}"

class GalleryImage(models.Model):
    image = models.ImageField(upload_to='gallery/')
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='gallery_images')
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Image uploaded by {self.uploaded_by.username} for {self.community.name}"

    class Meta:
        ordering = ['-uploaded_at']

class Vote(models.Model):
    VOTE_TYPES = (
        ('up', 'Upvote'),
        ('down', 'Downvote'),
    )

    resource = models.ForeignKey('Resource', on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    vote_type = models.CharField(max_length=4, choices=VOTE_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('resource', 'user')

class Reaction(models.Model):
    REACTION_TYPES = [
        ('like', '👍'),
        ('heart', '❤️'),
        ('funny', '😂'),
        ('wow', '😮'),
        ('sad', '😢'),
        ('angry', '😠')
    ]
    
    post = models.ForeignKey('ForumPost', on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=10, choices=REACTION_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('post', 'user', 'reaction_type')

class Question(models.Model):
    content = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    community = models.ForeignKey(Community, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    media = models.FileField(upload_to='forum_media/', null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def get_vote_count(self):
        upvotes = self.question_votes.filter(vote_type='up').count()
        downvotes = self.question_votes.filter(vote_type='down').count()
        return upvotes - downvotes

class Answer(models.Model):
    content = models.TextField()
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    votes = models.IntegerField(default=0)

    class Meta:
        ordering = ['-votes', '-created_at']

class AnswerVote(models.Model):
    answer = models.ForeignKey(Answer, on_delete=models.CASCADE, related_name='answer_votes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    vote_type = models.CharField(max_length=4, choices=Vote.VOTE_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['answer', 'user']

class QuestionVote(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='question_votes')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    vote_type = models.CharField(max_length=4, choices=Vote.VOTE_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['question', 'user']

