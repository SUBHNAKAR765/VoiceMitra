import os
import logging
from gradio_client import Client, handle_file

logger = logging.getLogger(__name__)

# Fallback image if not found
DEFAULT_IMAGE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "avatar.png"))

async def generate_sadtalker_video(audio_path: str, image_path: str = None) -> str:
    """
    Calls a Hugging Face Space running SadTalker (vinthony/SadTalker) to generate a talking head video.
    Returns the URL/path of the generated video.
    """
    if not image_path:
        image_path = DEFAULT_IMAGE_PATH
        
    if not os.path.exists(image_path):
        logger.warning(f"Image not found at {image_path}, SadTalker generation may fail if no default image is used.")
        
    try:
        # Note: the public vinthony/SadTalker space is often busy or fails. 
        # But this is the standard way to call it programmatically.
        client = Client("vinthony/SadTalker")
        
        # predict signature for vinthony/SadTalker:
        # source_image, driven_audio, preprocess, is_still_mode, enhancer, batch_size, size, pose_style, f_res
        result = client.predict(
            source_image=handle_file(image_path),
            driven_audio=handle_file(audio_path),
            preprocess='crop', # ['crop', 'resize', 'full']
            is_still_mode=True,
            enhancer='gfpgan', # ['gfpgan', 'RestoreFormer']
            batch_size=1,
            size=256,
            pose_style=0,
            f_res=True,
            api_name="/predict"
        )
        
        # result is typically a tuple or dict, but for gradio videos, it's usually the filepath to the video or a dict with 'video'
        video_path = result
        if isinstance(result, dict) and 'video' in result:
            video_path = result['video']
        elif isinstance(result, tuple) and len(result) > 0:
            video_path = result[0]
            if isinstance(video_path, dict) and 'video' in video_path:
                video_path = video_path['video']
                
        return video_path
        
    except Exception as e:
        logger.error(f"SadTalker API Error: {str(e)}")
        # If generation fails (e.g. queue full), fallback to None so it can just play audio.
        return None
