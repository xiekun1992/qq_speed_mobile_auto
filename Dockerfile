FROM node

# config timezone
RUN echo "Asia/Shanghai" > /etc/timezone && dpkg-reconfigure -f noninteractive tzdata

RUN apt-get update

# resolve Electron runtime environment
RUN apt-get -y install libgtk-3-0 libgconf-2-4 libpangocairo-1.0-0 chromium

# resolve `Gtk-Message: Failed to load module "canberra-gtk-module"`
RUN apt-get install -y libcanberra-gtk*

RUN apt-get autoclean

RUN npm config set registry https://registry.npm.taobao.org/
RUN npm config set electron_mirror https://npm.taobao.org/mirrors/electron/
RUN npm install -g electron --unsafe-perm=true

# Usage:
# xhost +
# sudo docker run -it -v $HOME:/app -e DISPLAY=$DISPLAY -v /tmp/.X11-unix:/tmp/.X11-unix -v /usr/share/fonts:/usr/share/fonts --rm electron:v1 bash