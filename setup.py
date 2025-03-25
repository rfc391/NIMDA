
from setuptools import setup, find_packages

setup(
    name="project_name",
    version="0.0.1",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    install_requires=[
        "pyyaml",
    ],
    author="Your Name",
    description="A brief description of your project",
    try:
        long_description = open("README.md").read()
    except FileNotFoundError:
        long_description = ""
    long_description_content_type="text/markdown",
)
