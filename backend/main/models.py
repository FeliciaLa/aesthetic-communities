from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.conf import settings
from django.db.models import Count, Q
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db.models.signals import post_save
from django.dispatch import receiver

class Community(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    banner_image = models.ImageField(upload_to='community_banners/', null=True, blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    members = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='communities')

    class Meta:
        verbose_name_plural = "Communities"

    def __str__(self):
        return self.name

    def get_similar_communities(self):
        """Find similar communities based on various factors"""
        # Get users who are members of this community
        member_users = self.members.all()
        
        # Find other communities these users are members of
        similar_by_members = Community.objects.filter(
            members__in=member_users
        ).exclude(id=self.id)
        
        # Find communities with similar names or descriptions
        similar_by_content = Community.objects.filter(
            Q(name__icontains=self.name) |
            Q(description__icontains=self.description)
        ).exclude(id=self.id)
        
        # Combine and annotate with a similarity score
        similar_communities = (similar_by_members | similar_by_content).distinct().annotate(
            member_overlap=Count('members', filter=Q(members__in=member_users)),
            total_views=Count('views'),
            total_members=Count('members')
        )
        
        return similar_communities.order_by('-member_overlap', '-total_views', '-total_members')[:5]

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
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='forum_posts')
    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_posts', blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.created_by.username}'s post in {self.community.name}"

class ForumComment(models.Model):
    content = models.TextField()
    post = models.ForeignKey(ForumPost, on_delete=models.CASCADE, related_name='comments')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.created_by.username} on {self.post.content[:50]}"

class GalleryImage(models.Model):
    image = models.ImageField(upload_to='gallery/')
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='gallery_images')
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
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
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
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
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    votes = models.IntegerField(default=0)

    class Meta:
        ordering = ['-votes', '-created_at']

class AnswerVote(models.Model):
    answer = models.ForeignKey(Answer, on_delete=models.CASCADE, related_name='answer_votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    vote_type = models.CharField(max_length=4, choices=Vote.VOTE_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['answer', 'user']

class QuestionVote(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='question_votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    vote_type = models.CharField(max_length=4, choices=Vote.VOTE_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['question', 'user']

class Poll(models.Model):
    question = models.TextField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    community = models.ForeignKey(Community, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class PollOption(models.Model):
    poll = models.ForeignKey(Poll, related_name='options', on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    votes = models.ManyToManyField(settings.AUTH_USER_MODEL, through='PollVote', related_name='poll_votes')

    def vote_count(self):
        return self.votes.count()

class PollVote(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    option = models.ForeignKey(PollOption, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'option']

class Announcement(models.Model):
    content = models.TextField()
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='announcements')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class RecommendedProduct(models.Model):
    title = models.CharField(max_length=200)
    url = models.URLField(max_length=2000)
    comment = models.TextField(null=True, blank=True)
    catalogue_name = models.CharField(max_length=100, null=True, blank=True)
    community = models.ForeignKey('Community', on_delete=models.CASCADE, null=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class SavedImage(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_images')
    image = models.ForeignKey(GalleryImage, on_delete=models.CASCADE)
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'image')

class SavedResource(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_resources')
    resource = models.ForeignKey(Resource, on_delete=models.CASCADE)
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'resource')

class SavedProduct(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_products')
    product = models.ForeignKey(RecommendedProduct, on_delete=models.CASCADE)
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')
        ordering = ['-saved_at']

    def __str__(self):
        return f"{self.user.username} saved {self.product.title}"

class SavedCollection(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='saved_collections')
    collection = models.ForeignKey(ResourceCategory, on_delete=models.CASCADE)
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'collection')
        ordering = ['-saved_at']

    def __str__(self):
        return f"{self.user.username} saved {self.collection.name}"

class CommunityView(models.Model):
    community = models.ForeignKey(Community, on_delete=models.CASCADE, related_name='views')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    viewed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('community', 'user')

class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    email_verified = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.user.username}'s profile"

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, username, password, **extra_fields)

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    groups = models.ManyToManyField(
        'auth.Group',
        related_name='custom_user_set',
        blank=True,
        help_text='The groups this user belongs to.'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        related_name='custom_user_set',
        blank=True,
        help_text='Specific permissions for this user.'
    )
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.email

