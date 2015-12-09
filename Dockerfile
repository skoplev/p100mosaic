FROM debian:stable
RUN mkdir -p /p100mosaic

# General installs
RUN apt-get update && apt-get install -y \
	apache2 \
	apache2-prefork-dev \
	libapache2-mod-wsgi

# Python installs
RUN apt-get update && apt-get install -y \
	python \
	python-dev \
	python-pip \
	python-setuptools

# pip installs
RUN pip install -Iv Flask==0.10.1

# RUN pip install \
# 	numpy \
# 	cython

EXPOSE 5000
 
ADD . /p100mosaic

WORKDIR /p100mosaic
CMD ./p100mosaic.py