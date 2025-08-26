curl -o- https://fnm.vercel.app/install | bash
FNM_PATH="/home/ec2-user/.local/share/fnm"
if [ -d "$FNM_PATH" ]; then
  export PATH="$FNM_PATH:$PATH"
  eval "`fnm env`"
fi
fnm install 22

sudo dnf install git -y

sudo su
cd /
mkdir /apps
cd /apps
git clone https://github.com/ullasasindhur/bunny-stream-server.git
cd bunny-stream-server

sudo dnf install mariadb105-server -y
sudo systemctl start mariadb
sudo systemctl enable mariadb
sudo systemctl status mariadb
sudo mysql_secure_installation

touch .env
vi .env

sudo chown -R ec2-user:ec2-user /apps/bunny-stream-server
npm i

sudo tee /etc/systemd/system/bunny-stream.service > /dev/null << 'EOF'
[Unit]
Description=Bunny Stream Server
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/apps/bunny-stream-server
ExecStart=/bin/bash -c 'source /home/ec2-user/.bashrc && npm start'
Restart=on-failure
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF


sudo systemctl daemon-reload
sudo systemctl enable bunny-stream
sudo systemctl start bunny-stream

sudo systemctl status bunny-stream