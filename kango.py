#!/usr/bin/env python
# -*- coding: UTF-8

import shutil
import os
import xml.dom.minidom
import binascii
import struct
import sys
import json
import codecs
import re
import subprocess
import ctypes
import zipfile
import argparse
import uuid
import string
import plistlib
from abc import ABCMeta, abstractmethod, abstractproperty

__title__ = 'Kango browser extension builder'
__author__ = 'KangoExtensions'
__version__ = '0.9.3'
	
#----------------------------------------------------------------------
# Utils

def log(text):
    print >>sys.stderr, text

def copy_dir_contents(src, dst, ignore=None):
	names = os.listdir(src)
	if ignore is not None:
		ignored_names = ignore(src, names)
	else:
		ignored_names = set()

	try:
		os.makedirs(dst)
	except:
		pass
		
	for name in names:
		if name in ignored_names:
			continue
		srcname = os.path.join(src, name)
		dstname = os.path.join(dst, name)
		
		if os.path.isdir(srcname):
			copy_dir_contents(srcname, dstname, ignore)
		else:
			try:
				shutil.copy(srcname, dstname)
			except:
				pass

def move_dir_contents(src, dst, ignore=None):
	names = os.listdir(src)
	if ignore is not None:
		ignored_names = ignore(src, names)
	else:
		ignored_names = set()

	try:
		os.makedirs(dst)
	except:
		pass
	
	for name in names:
		if name in ignored_names:
			continue
		srcname = os.path.join(src, name)
		dstname = os.path.join(dst, name)
		
		if os.path.isdir(srcname):
			move_dir_contents(srcname, dstname, ignore)
			try:
				os.removedirs(srcname)
			except:
				pass
		else:
			try:
				shutil.move(srcname, dstname)
			except:
				pass

def get_prefix_from_name(name):
	return filter(lambda x: x.isalpha(), name)
	
def get_extension_package_name(info):
	return (get_prefix_from_name(info.name) + '_' + info.version).lower()
		
class ZipDirectoryArchiver(object):

	def _archive(self, zip, arcname, src):
		files = os.listdir(src)
		for filename in files:
			path = os.path.join(src, filename)
			name = os.path.join(arcname, filename)
			if os.path.isdir(path):
				self._archive(zip, name, path)
			else:
				zip.write(path, name)
	
	def archive(self, src, dst):
		zip = zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED)
		self._archive(zip, '', src)
		zip.close()

class ClosureCompilerHelper(object):

	_binName = 'compiler.jar'
	
	def get_path(self):
		path = os.path.join(sys.path[0], self._binName)
		if os.path.exists(path):
			return path
		elif os.path.exists(self._binName):
			return self._binName
		else:
			return None
	
	def is_installed(self):
		return self.get_path() is not None
	
	def minimize_file(self, path):
		compilerPath = self.get_path()
		if compilerPath is not None:
			subprocess.call('java -jar "' + compilerPath + '" --js "' + path + '" --js_output_file "' + path + '.enc" --compilation_level SIMPLE_OPTIMIZATIONS')
			shutil.copy(path + '.enc', path)
			os.remove(path + '.enc')
		
	def process_dir(self, src):
		files = os.listdir(src)
		for filename in files:
			path = os.path.join(src, filename)
			if os.path.isdir(path):
				self.process_dir(path)
			else:
				extension = os.path.splitext(filename)[1]
				if extension == '.js':
					self.minimize_file(path)
					
#----------------------------------------------------------------------
# Project Builder
		
class ExtensionInfo(object): 
# Common	
	id = ''
	name = ''
	description = ''
	version = ''
	creator = ''
	homepage_url = ''
	content_scripts = []
	background_scripts = []
	settings = None
	browser_button = None
	toolbar = None
	update_url = ''
	internal_name = ''
	
# Safari	
	bundle_version = '' #for safari
	
# IE
	bho_iid = '' #ie гуид должен совпадать через каждый байт начиная со второго. тоесть IID {EF675053-FCCA-4386-9B89-2A7545106E49} можно менять на {5C675053-38CA-4086-9B94-2AF445E26E6E}
	toolbar_iid = '' # смотри комментарий выше
	bho_clsid = ''
	toolbar_clsid = ''
	libid = '' #ie

# Opera
	mail = '' #for opera
	
# Firefox
	components = None


	def merge(self, seq):
		result = []
		for s in seq:
			if s not in result:
				result.append(s)
		return result
	
	def load(self, filename):
		f = open(filename, 'rt')
		info = json.loads(f.read(), encoding='utf-8')
		f.close()
		for elem in info:
			if hasattr(self, elem):
				if elem == 'background_scripts':
					self.background_scripts = self.merge(self.background_scripts + info[elem])
				elif elem == 'content_scripts':
					self.content_scripts = self.merge(self.content_scripts + info[elem])
				else:
					self.__dict__[elem] = info[elem] 
				
	def save(self, filename):
		f = open(filename, 'wt')
		f.write(json.dumps(self.__dict__, skipkeys=True, indent=2))
		f.close()

class ExtensionBuilder(object):
	__metaclass__ = ABCMeta
	
	key = ''

	@abstractmethod
	def build(self, out_path):
		pass
	
	@abstractmethod	
	def pack(self, dst, src):
		pass
		
	def insert_background_scripts(self, text, scripts):
		placeholder_sign = '<!-- BACKGROUND_SCRIPTS_PLACEHOLDER -->'
		str = '<!-- Background scripts -->\n'
		for script in scripts:
			str += '<script src="' + script + '" type="text/javascript"></script>\n'
		return text.replace(placeholder_sign, str)
		
class ChromeExtensionBuilder(ExtensionBuilder):
	
	key = 'chrome'
	
	_manifest_filename = 'manifest.json'
	_background_host_filename = 'background.html'
	_info = None
	
	def __init__(self, info):
		self._info = info
		
	def _unix_find_app(self, prog_filename):
		bdirs = ['$HOME/Environment/local/bin/',
			'$HOME/bin/',
			'/share/apps/bin/',
			'/usr/local/bin/',
			'/usr/bin/']
		for d in bdirs:
			p = os.path.expandvars(os.path.join(d, prog_filename))
			if os.path.exists(p):
				return p
		return None
	
	def get_chrome_path(self):
		if sys.platform.startswith('win'):
			try:
				import ctypes.wintypes
				CSIDL_LOCAL_APPDATA = 0x001c
				_SHGetFolderPath = ctypes.windll.shell32.SHGetFolderPathW
				_SHGetFolderPath.argtypes = [ctypes.wintypes.HWND, ctypes.c_int,
											ctypes.wintypes.HANDLE, ctypes.wintypes.DWORD,
											ctypes.wintypes.LPCWSTR]
				path_buf = ctypes.wintypes.create_unicode_buffer(ctypes.wintypes.MAX_PATH)
				result = _SHGetFolderPath(0, CSIDL_LOCAL_APPDATA, 0, 0, path_buf)
				chrome_path = os.path.join(path_buf.value, 'Google', 'Chrome', 'Application', 'chrome.exe')
				chromium_path = os.path.join(path_buf.value, 'Chromium', 'Application', 'chrome.exe')		
				apppathes = [chrome_path, chromium_path]
				for apppath in apppathes:
					if os.path.exists(apppath):
						return apppath
			except:
				pass
		elif sys.platform.startswith('linux'):
			appnames = ['chromium-browser', 'google-chrome', 'chromium']
			for apppath in appnames:
				path = self._unix_find_app(apppath)
				if path is not None:
					return path
		elif sys.platform.startswith('darwin'):
			if os.path.exists('/Applications/Google Chrome.app'):
				return '/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome'
			elif os.path.exists('/Applications/Chromium.app'):
				return '/Applications/Chromium.app/Contents/MacOS/Chromium'
		return None
	
	def _patch_manifest(self, out):
		manifestPath = os.path.join(out, self._manifest_filename)
		f = open(manifestPath, 'rt')
		manifest = json.loads(f.read())
		f.close()
		
		if self._info.update_url == '':
			del manifest['update_url']
		
		if self._info.homepage_url == '':
			del manifest['homepage_url']
			
		for elem in manifest:
			if(elem != 'content_scripts' and hasattr(self._info, elem)):
				manifest[elem] = self._info.__dict__[elem]
		
		if self._info.browser_button is None:
			  del manifest['browser_action']
		else:
			manifest['browser_action']['default_icon'] = self._info.browser_button['icon']
			manifest['browser_action']['default_title'] = self._info.browser_button['tooltipText']
			if 'popup' not in self._info.browser_button:
				del manifest['browser_action']['default_popup']
		
		f = open(manifestPath, 'wt')
		f.write(json.dumps(manifest, indent=2))
		f.close()
	
	def _patch_background_host(self, out_path):
		path = os.path.join(out_path, self._background_host_filename)
		encoding = 'utf-8-sig'
		
		f = codecs.open(path, 'r', encoding)
		content = f.read()
		f.close()
		
		content = self.insert_background_scripts(content, self._info.background_scripts)
			
		f = codecs.open(path, 'w', encoding)
		f.write(content)
		f.close()
		
	def build(self, out_path):
		self._patch_manifest(out_path)
		self._patch_background_host(out_path)
		return out_path
		
	def pack(self, dst, src):
		chrome_path = self.get_chrome_path()
		if chrome_path is not None:
			extension_path = os.path.abspath(src)
			certificate_path = os.path.abspath(os.path.join(extension_path, '../', '../', 'certificates'))
			if not os.path.exists(certificate_path):
				os.makedirs(certificate_path)
			certificate_path = os.path.join(certificate_path, 'chrome.pem')
	
			cmd = chrome_path + ' --pack-extension="' + extension_path + '"'			
			if os.path.isfile(certificate_path):
				cmd += ' --pack-extension-key="' + certificate_path + '"'
			cmd += ' --no-message-box'
			os.system(cmd.encode(sys.getfilesystemencoding()))
			
			extension_dst = os.path.abspath(os.path.join(extension_path, '../', 'chrome.crx'))
			if not os.path.isfile(extension_dst):
				cmd = '"' + chrome_path + '"' + ' --pack-extension="' + extension_path + '"'			
				if os.path.isfile(certificate_path):
					cmd += ' --pack-extension-key="' + certificate_path + '"'
				cmd += ' --no-message-box'
				subprocess.call(cmd.encode(sys.getfilesystemencoding()))
			try:
				shutil.move(os.path.abspath(os.path.join(extension_path, '../', 'chrome.pem')), certificate_path)
			except:
				pass
			shutil.move(extension_dst,  os.path.join(dst, get_extension_package_name(self._info) + '.crx'))
		else:
			log('Chrome/Chromium is not installed, can\'t pack chrome extension.')
		
class SafariExtensionBuilder(ExtensionBuilder):
	
	key = 'safari'
	
	_config_filename = 'info.plist'
	_background_host_filename = 'background.html'
	_info = None
	_transform_table = {
		'CFBundleIdentifier': 'id',
		'CFBundleDisplayName': 'name',
		'Description': 'description',
		'CFBundleShortVersionString': 'version',
		'Author': 'creator',
		'CFBundleVersion': 'bundle_version',
		'Update Manifest URL': 'update_url',
		'Website': 'homepage_url'
	}
	
	def __init__(self, info):
		self._info = info
		
	def _patchPlist(self, out_path):
		path = os.path.join(out_path, self._config_filename)
		plist = plistlib.readPlist(path)
		for key in self._transform_table:
			if key in plist and hasattr(self._info, self._transform_table[key]):
				plist[key] = getattr(self._info, self._transform_table[key])
		
		if self._info.browser_button is not None:
			item = plist['Chrome']['Toolbar Items'][0]
			item['Label'] = self._info.name
			item['Tool Tip'] = self._info.name
			item['Image'] = self._info.browser_button['icon']
		else:
			del plist['Chrome']['Toolbar Items']
		
		plistlib.writePlist(plist, path)

		
	def _copy_icon(self, out_path):
		src = os.path.join(out_path, 'icons', 'icon100.png')
		dst = os.path.join(out_path, 'icon.png')
		try:
			shutil.copy(src, dst)
		except:
			log('Can\'t find icon100.png')
	
	def _patch_background_host(self, out_path):
		path = os.path.join(out_path, self._background_host_filename)
		encoding = 'utf-8-sig'
		
		f = codecs.open(path, 'r', encoding)
		content = f.read()
		f.close()
		
		content = self.insert_background_scripts(content, self._info.background_scripts)
			
		f = codecs.open(path, 'w', encoding)
		f.write(content)
		f.close()
	
	def build(self, out_path):
		self._patchPlist(out_path)
		self._copy_icon(out_path)
		self._patch_background_host(out_path)		
		subfolder_name = get_prefix_from_name(self._info.name)+'.safariextension'
		out = os.path.join(out_path, subfolder_name)
		move_dir_contents(out_path, out, shutil.ignore_patterns(subfolder_name))
		return out
		
	def pack(self, dst, src):
		pass
		
class OperaExtensionBuilder(ExtensionBuilder):
	
	key = 'opera'
	
	_config_filename = 'config.xml'
	_background_host_filename = 'background.html'
	_info = None
	_transform_table = {
		'id': {'tag':'widget', 'param':'id'},
		'name': {'tag': 'name'},
		'description': {'tag': 'description'},
		'version': {'tag':'widget', 'param':'version'},
		'creator': {'tag': 'author'},
		'homepage_url': {'tag':'author', 'param':'href'},
		'update_url': {'tag':'update-description', 'param':'href'}
	}
	
	def __init__(self, info):
		self._info = info
	
	# TODO: separate to HTMLBackgroundHost
	def _patch_background_host(self, out_path):
		path = os.path.join(out_path, self._background_host_filename)
		encoding = 'utf-8-sig'
		
		f = codecs.open(path, 'r', encoding)
		content = f.read()
		f.close()
		
		content = self.insert_background_scripts(content, self._info.background_scripts)
			
		f = codecs.open(path, 'w', encoding)
		f.write(content)
		f.close()
		
	def _patch_config(self, out_path):
		path = os.path.join(out_path, self._config_filename)
		doc = xml.dom.minidom.parse(path)
		for key in self._transform_table:
			xmlElem = doc.getElementsByTagName(self._transform_table[key]['tag'])[0]
			if xmlElem is not None and key in self._info.__dict__:
				if 'param' in self._transform_table[key]:
					xmlElem.setAttribute(self._transform_table[key]['param'], self._info.__dict__[key]);
				else:
					xmlElem.childNodes[0].data = self._info.__dict__[key]
		f = codecs.open(path, 'w', 'utf-8')
		f.write(doc.toxml())
		f.close()
	
	def build(self, out_path):
		self._patch_config(out_path)
		self._patch_background_host(out_path)
		return out_path
		
	def pack(self, dst, src):
		name = get_extension_package_name(self._info) + '.oex'
		zip = ZipDirectoryArchiver()
		outpath = os.path.join(dst, name)
		zip.archive(src, outpath)

class FirefoxExtensionBuilder(ExtensionBuilder):
	
	key = 'firefox'
	
	_info = None
	_transform_table = {
		'em:id': 'id',
		'em:name': 'name',
		'em:description': 'description',
		'em:version': 'version',
		'em:creator': 'creator',
		'em:homepageURL': 'homepage_url',
		'em:updateURL': 'update_url'
	}
	_extensions_to_patch = ['.js', '.manifest', '.rdf']
	_config_filename = os.path.join('chrome', 'content', 'content.xul')
	
	def __init__(self, info):
		self._info = info
		
	def _patch_rdf(self, out_path):
		path = os.path.join(out_path, 'install.rdf')
		doc = xml.dom.minidom.parse(path)
		rdf = doc.getElementsByTagName('RDF')[0]
		description = rdf.getElementsByTagName('Description')[0]
		for key in self._transform_table:
			if self._transform_table[key] in self._info.__dict__:
				xmlElem = description.getElementsByTagName(key)[0]
				xmlElem.childNodes[0].data = self._info.__dict__[self._transform_table[key]]
		f = codecs.open(path, 'w', 'utf-8')
		f.write(doc.toxml())
		f.close()	
	
	def _patch_config(self, out_path):
		path = os.path.join(out_path, self._config_filename)
		encoding = 'utf-8-sig'
		
		f = codecs.open(path, 'r', encoding)
		content = f.read()
		f.close()
		
		prefix = get_prefix_from_name(self._info.name)
		content = self.insert_background_scripts(content, self._info.background_scripts).replace('chrome://kango/', 'chrome://' + prefix + '_kango/')
		
		if self._info.browser_button is None:
			content = re.sub('<!-- UI_BROWSER_BUTTON_START -->(.*)<!-- UI_BROWSER_BUTTON_END -->', '', content, flags=re.IGNORECASE|re.DOTALL)
		else:
			content = content.replace('icons/button.png', self._info.browser_button['icon'])
		
		if self._info.toolbar is None:
			content = re.sub('<!-- UI_TOOLBAR_START -->(.*)<!-- UI_TOOLBAR_END -->', '', content, flags=re.IGNORECASE|re.DOTALL)
		else:
			content = content.replace('toolbarname="Kango"', 'toolbarname="'+self._info.name+'"')
			
		content = re.sub('id="kango', 'id="' + prefix + '_kango', content, flags=re.IGNORECASE)
			
		f = codecs.open(path, 'w', encoding)
		f.write(content)
		f.close()
	
	def _patch_manifest(self, out_path):
		if self._info.components is not None:
			component = self._info.components[0]
			path = os.path.join(out_path, 'chrome.manifest')
			f = open(path, 'r')
			content = f.read()
			f.close()				

			f = open(path, 'wt')
			f.write(content)
			f.write('\ncomponent ' + component['class_id'] + ' ' + component['filename'])
			f.write('\ncontract ' + component['contract_id'] + ' ' + component['class_id'])
			f.write('\ncategory profile-after-change ' + component['name'] + ' ' + component['contract_id'])
			f.close()
	
	def _is_component(self, path):
		if self._info.components is not None and os.path.normpath(path).find(os.path.normpath(self._info.components[0]['filename'])) != -1:
			return True
		return False
		
	def _patch_file(self, path):
		encoding = 'utf-8-sig'
		extension = os.path.splitext(path)[1]
		if extension == '.manifest' or self._is_component(path):
			encoding = 'utf-8'
		f = codecs.open(path, 'r', encoding)
		content = f.read()
		f.close()
		
		header = re.search('// ==UserScript==(.*)// ==/UserScript==', content, flags=re.IGNORECASE|re.DOTALL)
		if header is None:
			name = get_prefix_from_name(self._info.name)
			content = re.sub("(?<!')kango(?!-|Extensions)", name + '_kango', content, flags=re.IGNORECASE)
			content = re.sub("'kango-ui", "'" + name + '_kango-ui', content, flags=re.IGNORECASE)

			f = codecs.open(path, 'w', encoding)
			f.write(content)
			f.close()
		
	def _patch_sources(self, out_path, exclude_pathes):
		files = os.listdir(out_path)
		for filename in files:
			path = os.path.join(out_path, filename)
			if os.path.isdir(path):
				self._patch_sources(path, exclude_pathes)
			elif os.path.abspath(path) not in exclude_pathes:
				extension = os.path.splitext(filename)[1]
				if extension in self._extensions_to_patch:
					self._patch_file(path)
	
	def _get_html_scripts(self, path):
		scripts = []
		f = open(path, 'r')
		html = f.read()
		matches = re.findall('<script[^>]+src\s*=\s*[\'"]([^\'"]+)[\'"][^>]*>', html, flags=re.IGNORECASE)
		for src in matches:
			scripts.append(os.path.abspath(os.path.join(os.path.dirname(path), src)))
		f.close()
		return scripts
	
	def _get_popup_scripts(self, dir):
		scripts = []
		files = os.listdir(dir)
		for filename in files:
			path = os.path.join(dir, filename)
			if os.path.isdir(path):
				scripts.extend(self._get_popup_scripts(path))
			else:
				extension = os.path.splitext(filename)[1]
				if extension == '.html':
					scripts.extend(self._get_html_scripts(path))
		return scripts
	
	def build(self, out_path):
		self._patch_rdf(out_path)
		self._patch_manifest(out_path)	
		out = os.path.join(out_path, 'chrome')
		if not os.path.exists(out):
			os.makedirs(out)
		out = os.path.join(out, 'content')
		if not os.path.exists(out):
			os.makedirs(out)
		move_dir_contents(out_path, out, shutil.ignore_patterns('chrome', 'chrome.manifest', 'install.rdf', 'components'))
		exclude_pathes = self._get_popup_scripts(out_path)
		self._patch_sources(out_path, exclude_pathes)
		self._patch_config(out_path)
		return out
		
	def _encode_components(self, src):
		components_path = os.path.join(src, 'components')
		if os.path.isdir(components_path):
			files = os.listdir(components_path)
			for filename in files:
				extension = os.path.splitext(filename)[1]
				if extension == '.js':
					path = os.path.join(components_path, filename)
					f = codecs.open(path, 'r', 'utf-8-sig')
					content = f.read()
					f.close()
					
					f = codecs.open(path, 'w', 'ascii')
					f.write(content)
					f.close()
		
	def pack(self, dst, src):
		name = get_extension_package_name(self._info) + '.xpi'
		zip = ZipDirectoryArchiver()
		outpath = os.path.join(dst, name)
		src = os.path.join(src, os.pardir, os.pardir)
		self._encode_components(src)
		zip.archive(src, outpath)
		
class ProjectBuilder(object):	

	_extensionInfoFileName = 'extension_info.json'
	_output_dir_name = 'output'
	_builders = [ ChromeExtensionBuilder, FirefoxExtensionBuilder, OperaExtensionBuilder, SafariExtensionBuilder ]
	minimize = False
	add_header = False
	project_directory = r''
	sourceDir = r''
	jsSourceDir = os.path.join('src', 'js')
	headerFilePath = 'header.txt'
	out_path = ''
	
	def __init__(self):
		pass
	
	def _get_userscript_header(self, path):
		f = open(path, 'r')
		content = f.read()
		f.close()	
		header = re.search('// ==UserScript==(.*)// ==/UserScript==', content, flags=re.IGNORECASE|re.DOTALL)
		if(header is not None):
			return header.group(0)
		return None
	
	def _add_text_to_beginning(self, path, text):
		encoding = 'utf-8-sig'
		f = codecs.open(path, 'r', encoding)
		content = f.read()
		f.close()
			
		content = text + content
		
		f = codecs.open(path, 'w', encoding)
		f.write(content)
		f.close()
		
	def _postprocess_files(self, dir):
		files = os.listdir(dir)
		for filename in files:
			path = os.path.join(dir, filename)
			if os.path.isdir(path):
				self._postprocess_files(path)
			else:
				if self.minimize:
					extension = os.path.splitext(path)[1]
					if extension == '.js' and string.rfind(path, r'.min.js')!=len(path)-7:
						header = self._get_userscript_header(path)
						ClosureCompilerHelper().minimize_file(path)
						if(header is not None):
							self._add_text_to_beginning(path, header + '\n')
				if self.add_header:
					self._add_header(path)
	
	def _add_header(self, path):
		if(os.path.exists(self.headerFilePath)):			
			f = open(self.headerFilePath, 'r')
			headerText = f.read()
			f.close()
			if(headerText != ''):
				extension = os.path.splitext(path)[1]
				if extension=='.js':
					userjsHeader = self._get_userscript_header(path)
					if(userjsHeader is None):
						self._add_text_to_beginning(path, headerText + '\n')				
		
	def _copy_dir(self, src, out, dir):
		src = os.path.join(src, dir)
		copy_dir_contents(src, out, ignore=shutil.ignore_patterns('.svn', '*.exp', '*.ilk', '*.lib', '.idea'))
	
	def _merge_files(self, first, second, dst):
		encoding = 'utf-8-sig'
		f = codecs.open(first, 'r', encoding)
		content = f.read()
		f.close()
		
		f = codecs.open(second, 'r', encoding)
		content += '\r\n\r\n// Merged from ' + second + '\r\n\r\n' + f.read()
		f.close()
		
		f = codecs.open(dst, 'w', encoding)
		f.write(content)
		f.close()
	
	def _merge_jss(self, file, out):
		part_sign = '.part'
		extension = os.path.splitext(file)[1]
		filename = os.path.splitext(file)[0]
		if extension == '.js':
			if file.find(part_sign) != -1:
				name = os.path.basename(file.replace(part_sign, ''))
				dst_path = os.path.join(out, name)
				if os.path.isfile(dst_path):
					self._merge_files(dst_path, file, dst_path)
					return True
			else:
				dst_path = os.path.join(out, os.path.basename(filename+part_sign+extension))
				src_path = os.path.join(out, os.path.basename(file))
				if os.path.isfile(dst_path):
					self._merge_files(file, dst_path, src_path)
					os.remove(dst_path)
					return True
		return False
		
	def _merge_dirs(self, src, out):
		ignore = shutil.ignore_patterns('.svn', '*.exp', '*.ilk', '*.lib', '.idea')
		names = os.listdir(src)
		ignored_names = ignore(src, names)
		
		try:
			os.makedirs(out)
		except:
			pass
			
		for name in names:
			if name in ignored_names:
				continue
			
			srcname = os.path.join(src, name)
			dstname = os.path.join(out, name)
			
			if os.path.isdir(srcname):
				self._merge_dirs(srcname, dstname)
			elif not self._merge_jss(srcname, out):
				try:
					shutil.copy(srcname, dstname)
				except:
					pass
		
	def _copy_extension_files(self, src, out, extensionKey):
		try:
			os.makedirs(out)
		except:
			pass
		self._copy_dir(src, out, 'common')		
		dirs = os.listdir(src)
		for dir in dirs:	
			if dir.find(extensionKey) != -1:
				self._merge_dirs(os.path.join(src, dir), out)
		
	def _build_extension(self, builderClass):
		key = builderClass.key
		info = ExtensionInfo()
		extensionInfoPath = os.path.join(self.project_directory, 'common', self._extensionInfoFileName)
		info.load(extensionInfoPath)
		extensionInfoPath = os.path.join(self.project_directory, key, self._extensionInfoFileName)
		info.load(extensionInfoPath)
		builder = builderClass(info)
		log('Building ' + builder.key + ' extension')
		out = os.path.join(self.out_path, builder.key)
		self._copy_extension_files(self.jsSourceDir, out, builder.key)
		self._copy_extension_files(self.project_directory, out, builder.key)				
		out = builder.build(out)
		info_out_path = os.path.join(out, self._extensionInfoFileName)
		info.internal_name = get_prefix_from_name(info.name)
		info.save(info_out_path)
		self._postprocess_files(out)
		
		f = open(os.path.join(out, 'readme.txt'), 'w')
		f.write('Built using Kango - Cross-browser extension framework. http://kangoextensions.com/')
		f.close()
		
		builder.pack(self.out_path, out)
		
	def build(self):
		if self.project_directory == sys.path[0]:
			print 'You must set project directory'
			sys.exit(1)

		self.out_path = os.path.join(self.project_directory, self._output_dir_name)
		self.project_directory = os.path.join(self.project_directory, 'src')
		try:
			shutil.rmtree(self.out_path)
		except:
			pass	
		for builderClass in self._builders:
			if os.path.isdir(os.path.join(self.project_directory, builderClass.key)):
				self._build_extension(builderClass)
	

#----------------------------------------------------------------------
# Project creator

class ProjectCreator(object):	

	_extensionInfoFileName = 'extension_info.json'
	project_directory = ''
	templates_directory = 'templates'
	
	def _generate_id(self):
		return '{' + str(uuid.uuid1()) + '}'
	
	def _copy_template(self, src_path, dst_path):
		src_path = os.path.join(self.templates_directory, src_path)
		try:
			shutil.copyfile(src_path, dst_path)
		except:
			pass
		
	def _create_dir(self, name):			
		if not os.path.exists(name):
			os.makedirs(name)
			
	def _create_extension_info(self, path, obj):	
		self._create_dir(path)
		extensionInfoPath = os.path.join(path, self._extensionInfoFileName)
		f = open(extensionInfoPath, 'wt')
		f.write(json.dumps(obj, skipkeys=True, indent=2))
		f.close()
		
	def _get_iid_from_id(self, iid, id):
		return iid
			
	def create(self):
		if self.project_directory == sys.path[0]:
			print 'You must set project directory'
			sys.exit(1)
	
		print 'Input project name: ',
		project_name = sys.stdin.readline()[:-1]
		
		self._create_dir(self.project_directory)
		
		src_dir = os.path.join(self.project_directory, 'src')
		self._create_dir(src_dir)
		self._create_dir(os.path.join(self.project_directory, 'certificates'))
		
		self._create_extension_info(os.path.join(src_dir, 'common'), {
			'name': project_name,
			'version': '0.9',
			'description': 'Extension description',
			'creator': 'KangoExtensions',
			'homepage_url': 'http://kangoextensions.com/',
			'background_scripts': ['main.js'],
			'content_scripts': [],
			'browser_button': {'icon': 'icons/button.png', 'tooltipText': 'Kango', 'caption': 'Kango'}
		})
		self._copy_template(os.path.join('browser_button', 'common', 'main.js'), os.path.join(src_dir, 'common', 'main.js'));
		
		self._create_extension_info(os.path.join(src_dir, 'firefox'), {'id': self._generate_id()})
		self._create_extension_info(os.path.join(src_dir, 'chrome'), {'id': self._generate_id()})
		
		id = self._generate_id()
		self._create_extension_info(os.path.join(src_dir, 'ie'), {
			'id': self._generate_id(),
			"bho_clsid":  self._generate_id(),
			"bho_iid": self._get_iid_from_id("{96E7211D-0650-43CF-8498-4C81E83AEAA1}", id),
			"toolbar_clsid":  self._generate_id(),
			"toolbar_iid": self._get_iid_from_id("{C0207057-3461-4F7F-B689-D016B7A0396E}", id),
			"libid":  self._generate_id()
		})
		self._create_extension_info(os.path.join(src_dir, 'safari'), {
			'id': 'com.kangoextensions.'+get_prefix_from_name(project_name).lower(),
			'bundle_version': '1'
		})
		self._create_extension_info(os.path.join(src_dir, 'opera'), {
			'id': 'http://kangoextensions.com/extensions/'+get_prefix_from_name(project_name).lower()+'/'
		})
		
		print 'Done'

#----------------------------------------------------------------------
# Commands

class Command(object):
	__metaclass__ = ABCMeta
	
	@abstractmethod
	def init_subparser(self, subparsers):
		pass
		
	@abstractmethod
	def execute(self, args):
		pass

class BuildCommand(Command):
	
	def init_subparser(self, subparsers):
		parser_build = subparsers.add_parser('build', help='Build project.')
		parser_build.add_argument('project_directory', default=os.getcwd())
		parser_build.add_argument('--minimize', action='store_true', help='Minimize sources.')
		parser_build.add_argument('--no_add_header', action='store_true', help='Not add header to all sources.')
		return parser_build
		
	def execute(self, args):
		builder = ProjectBuilder()
		
		builder.project_directory = args.project_directory
		builder.minimize = args.minimize
		builder.add_header = not args.no_add_header

		if os.path.isdir(builder.project_directory):
			builder.headerFilePath = os.path.join(sys.path[0], builder.headerFilePath)
			builder.sourceDir = sys.path[0];
			builder.jsSourceDir = os.path.join(sys.path[0], builder.jsSourceDir)
			
			if builder.minimize and not ClosureCompilerHelper().is_installed():
				log('compiler.jar not found')
			
			builder.build()
		else:
			log('Can\'t find directory ' + builder.project_directory)
			
		if 'IeExtensionBuilder' not in globals():
			print 'Contact extensions@kangoextensions.com to enable IE support.' 

class CreateProjectCommand(Command):
	
	def init_subparser(self, subparsers):
		parser_build = subparsers.add_parser('create', help='Create project.')
		parser_build.add_argument('project_directory', default=os.getcwd(), nargs='?')
		return parser_build
		
	def execute(self, args):
		creator = ProjectCreator()
		creator.project_directory = args.project_directory
		creator.templates_directory = os.path.join(sys.path[0], creator.templates_directory)
		creator.create()
			
class CommandLineProcessor(object):
	
	_commands = [BuildCommand, CreateProjectCommand]

	def process(self):
		
		parser = argparse.ArgumentParser(description=__title__ + ' ' + __version__)
		subparsers = parser.add_subparsers()
		
		for command_class in self._commands:
			command = command_class()
			subparser = command.init_subparser(subparsers)
			subparser.set_defaults(execute=command.execute)

		args = parser.parse_args()
		args.execute(args)

#----------------------------------------------------------------------
# Main
		
def main():	
	CommandLineProcessor().process()

if __name__ == '__main__':
    main()
