# -*- coding: utf-8 -*-
import scrapy
import logging
from scrapy.contrib.linkextractors import LinkExtractor
from scrapy.contrib.spiders import CrawlSpider, Rule
from scrapy.http import Request

from olx.items import OlxItem, DetailedItem


class OlxCrawlerSpider(CrawlSpider):
    name = 'olx_crawler'
    allowed_domains = ['olx.ro', 'imobiliare.ro']
    start_urls = [
        'http://olx.ro/imobiliare/apartamente-garsoniere-de-inchiriat/iasi_39939/?search%5Bprivate_business%5D=private&search%5Border%5D=created_at%3Adesc&search%5Bdist%5D=5',
        'http://www.imobiliare.ro/inchirieri-apartamente/iasi'
    ]

    rules = [
        Rule(LinkExtractor(allow=r'imobiliare/apartamente-garsoniere-de-inchiriat/iasi_39939/\?search%5Bprivate_business%5D=private&search%5Border%5D=created_at%3Adesc&search%5Bdist%5D=5&page=[1-5]'), callback='parse_item', follow=True),
        Rule(LinkExtractor(allow=r'http://www.imobiliare.ro/inchirieri-apartamente/iasi\?pagina=[1-5]'), callback='parse_imobiliare', follow=True)
    ]

    def parse_item(self, response):
        rentals = response.xpath('//h3[@class="x-large lheight20 margintop5"]')
        rental_urls = []
        for rental in rentals:
            url_array = rental.xpath(
                'a[@class="marginright5 link linkWithHash detailsLink"]/@href').extract()
            if url_array:
                rental_urls.append(url_array.pop())
        for rental_url in rental_urls:
            yield Request(rental_url, callback= self.parse_from_url)

    def parse_from_url(self, response):
        #logging.log(logging.DEBUG, response)
        item = DetailedItem()
        item['title'] = (response.xpath('//h1[@class="brkword lheight28"]/text()').extract()).pop().strip()
        item['details'] = (response.xpath('//div[@id="textContent"]/p[@class="pding10 lheight20 large"]/text()').extract()).pop().strip()
        item['owner'] = (response.xpath('//span[@class="block color-5 brkword xx-large"]/text()').extract()).pop().strip()
        date_posted = (response.xpath('//span[@class="pdingleft10 brlefte5"]/text()').extract())
        item['date_posted'] = date_posted
        
        item['images'] = []
        images = response.xpath('//div[@class="photo-glow"]/img/@src').extract()
        if images:
            for image in images:
                item['images'].append(image)
        
        details = response.xpath('//table[@class="item"]')
        #logging.log(logging.WARNING, details)
        if details:
            for detail in details:
                #logging.log(logging.WARNING, detail)
                header = detail.xpath('tbody/tr/th').extract()
                #logging.log(logging.WARNING, header)
                if header is "Compartimentare":
                    item['partitioning'] = detail.xpath('tbody/tr/td/strong/a/text()').extract()
                elif header is "Suprafata":
                    item['area'] = detail.xpath('tbody/tr/td/strong/text()').extract()
                elif header is "An constructie":
                    item['construction_year']  = detail.xpath('tbody/tr/td/strong/a/text()').extract()
        
        yield item

    def parse_imobiliare(self, response):
        rentals = response.xpath('//a[@class="visible-xs mobile-container-url"]')
        rental_urls = []
        for rental in rentals:
            url_array = rental.xpath(
                '@href').extract()
            if url_array:
                rental_urls.append(url_array.pop())
        for rental_url in rental_urls:
            yield Request(rental_url, callback=self.parse_imobiliare_from_url)

    def parse_imobiliare_from_url(self, response):
        item = DetailedItem()
        item['title'] = response.xpath('//div[@class="titlu"]/h1/text()').extract().pop().strip()
        item['details'] = response.xpath('//div[@id="b_detalii_specificatii"]/p/text()').extract()
        item['price'] = response.xpath('//div[@class="pret first blue"]/text()').extract()
        item['owner'] = response.xpath('//h4[@class="grey-medium"]/text()').extract()
        date_posted = response.xpath('//span[@class="data-actualizare"]/text()').extract().pop()
        tmp_dates = [int(s) for s in date_posted.split() if s.isdigit()]
        if tmp_dates:
            item['date_posted'] = tmp_dates.pop()
        item['images'] = []
        images = response.xpath('//div[@class="noselect "]/a/img/@src').extract()
        for image in images:
            item['images'].append(image)

        logging.log(logging.WARNING, 'parsed: === %s\n' % item['title'])
        yield item
