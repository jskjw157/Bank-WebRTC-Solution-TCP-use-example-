FROM ubuntu:22.04

# 환경 변수 설정
ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=20

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필수 패키지 설치
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    libmicrohttpd-dev \
    libjansson-dev \
    libssl-dev \
    libsrtp2-dev \
    libsofia-sip-ua-dev \
    libglib2.0-dev \
    libopus-dev \
    libogg-dev \
    libcurl4-openssl-dev \
    liblua5.3-dev \
    libconfig-dev \
    pkg-config \
    gengetopt \
    libtool \
    automake \
    gtk-doc-tools \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Node.js 설치
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# libnice 설치
RUN cd /tmp \
    && git clone https://gitlab.freedesktop.org/libnice/libnice \
    && cd libnice \
    && ./autogen.sh \
    && ./configure --prefix=/usr \
    && make && make install \
    && cd / && rm -rf /tmp/libnice

# usrsctp 설치
RUN cd /tmp \
    && git clone https://github.com/sctplab/usrsctp \
    && cd usrsctp \
    && ./bootstrap \
    && ./configure --prefix=/usr \
    && make && make install \
    && cd / && rm -rf /tmp/usrsctp

# Janus Gateway 설치
RUN cd /tmp \
    && git clone https://github.com/meetecho/janus-gateway.git \
    && cd janus-gateway \
    && sh autogen.sh \
    && ./configure \
        --prefix=/opt/janus \
        --enable-post-processing \
        --enable-docs \
        --enable-rest \
        --enable-data-channels \
        --enable-websockets \
        --enable-rabbitmq=no \
        --enable-mqtt=no \
    && make && make install && make configs \
    && cd / && rm -rf /tmp/janus-gateway

# 애플리케이션 파일 복사
COPY package*.json ./
RUN npm install --production

COPY . .

# 포트 노출
EXPOSE 3000 8088 8089 8188 8989 40000-40099

# 시작 스크립트
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
