FROM python:3.13.2-slim
WORKDIR /app
COPY . /app
RUN pip install -r requirements.txt
CMD ["python", "main.py"]

# Install gRPC tools
RUN pip install grpcio grpcio-tools
