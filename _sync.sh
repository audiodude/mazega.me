# use `pyenv activate s3cmd` before running this script.
s3cmd put --guess-mime-type --no-mime-magic --recursive --exclude '.git/*' --exclude '_*' --exclude '.python-version' . s3://mazega.me/
