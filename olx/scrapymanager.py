#scrapymanager

from random import randint
from time import sleep
from subprocess import call

call(["scrapy crawl olx_crawler"], shell=True)
sleep(randint(15, 45))
