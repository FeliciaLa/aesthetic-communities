import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

def get_preview_data(url):
    try:
        # Send a GET request to the URL
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        
        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Get meta data
        title = soup.find('meta', property='og:title') or soup.find('title')
        description = soup.find('meta', property='og:description') or soup.find('meta', {'name': 'description'})
        image = soup.find('meta', property='og:image')
        
        # Extract the values
        preview_data = {
            'title': title.get('content', '') if title and title.get('content') else title.string if title else '',
            'description': description.get('content', '') if description else '',
            'image': image.get('content', '') if image else '',
            'domain': urlparse(url).netloc
        }
        
        return preview_data
    except Exception as e:
        print(f"Error getting preview for {url}: {str(e)}")
        return None 