from google import genai
from google.genai import types


client = genai.Client()


def analyze_car_image(image_file):
    image_bytes = image_file.read()

    prompt = """
You are an experienced automobile technician.

Analyze this car image for visible mechanical or exterior issues that could
help troubleshoot the vehicle.

Only mention observations that are reasonably visible in the image.
Do not invent faults that cannot be seen.

Return a concise response containing:
1. Visible observations
2. Possible mechanical relevance
3. Recommended next check

If the image does not show a useful automotive issue, clearly say that
no obvious mechanical issue can be determined from the image.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=[
            types.Part.from_bytes(
                data=image_bytes,
                mime_type="image/jpeg",
            ),
            prompt,
        ],
    )

    return response.text