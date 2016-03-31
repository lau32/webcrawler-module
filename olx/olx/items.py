# -*- coding: utf-8 -*-

# Define here the models for your scraped items
#
# See documentation in:
# http://doc.scrapy.org/en/latest/topics/items.html

from scrapy.item import Item, Field


class OlxItem(Item):
    title = Field()
    url = Field()


class DetailedItem(Item):
    price = Field()
    phone = Field()
    rooms = Field()
    title = Field()
    images = Field()
    details = Field()
    date_posted = Field()
    owner = Field()
    area = Field()
    construction_year = Field()
    partitioning = Field()
