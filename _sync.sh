# use `pyenv activate s3cmd` before running this script.
s3cmd put --recursive --exclude '.git/*' --exclude '_*' . s3://mazega.me/
