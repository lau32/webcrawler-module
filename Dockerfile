FROM python:2.7

ADD requirements.txt opt/requirements.txt

RUN pip install -r opt/requirements.txt
RUN mkdir olx
WORKDIR /olx
