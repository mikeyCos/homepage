(self["webpackChunkmodule_webpack_starter"] = self["webpackChunkmodule_webpack_starter"] || []).push([["index"],{

/***/ "./node_modules/@iconfu/svg-inject/dist/svg-inject.js":
/*!************************************************************!*\
  !*** ./node_modules/@iconfu/svg-inject/dist/svg-inject.js ***!
  \************************************************************/
/***/ ((module) => {

/**
 * SVGInject - Version 1.2.3
 * A tiny, intuitive, robust, caching solution for injecting SVG files inline into the DOM.
 *
 * https://github.com/iconfu/svg-inject
 *
 * Copyright (c) 2018 INCORS, the creators of iconfu.com
 * @license MIT License - https://github.com/iconfu/svg-inject/blob/master/LICENSE
 */

(function(window, document) {
  // constants for better minification
  var _CREATE_ELEMENT_ = 'createElement';
  var _GET_ELEMENTS_BY_TAG_NAME_ = 'getElementsByTagName';
  var _LENGTH_ = 'length';
  var _STYLE_ = 'style';
  var _TITLE_ = 'title';
  var _UNDEFINED_ = 'undefined';
  var _SET_ATTRIBUTE_ = 'setAttribute';
  var _GET_ATTRIBUTE_ = 'getAttribute';

  var NULL = null;

  // constants
  var __SVGINJECT = '__svgInject';
  var ID_SUFFIX = '--inject-';
  var ID_SUFFIX_REGEX = new RegExp(ID_SUFFIX + '\\d+', "g");
  var LOAD_FAIL = 'LOAD_FAIL';
  var SVG_NOT_SUPPORTED = 'SVG_NOT_SUPPORTED';
  var SVG_INVALID = 'SVG_INVALID';
  var ATTRIBUTE_EXCLUSION_NAMES = ['src', 'alt', 'onload', 'onerror'];
  var A_ELEMENT = document[_CREATE_ELEMENT_]('a');
  var IS_SVG_SUPPORTED = typeof SVGRect != _UNDEFINED_;
  var DEFAULT_OPTIONS = {
    useCache: true,
    copyAttributes: true,
    makeIdsUnique: true
  };
  // Map of IRI referenceable tag names to properties that can reference them. This is defined in
  // https://www.w3.org/TR/SVG11/linking.html#processingIRI
  var IRI_TAG_PROPERTIES_MAP = {
    clipPath: ['clip-path'],
    'color-profile': NULL,
    cursor: NULL,
    filter: NULL,
    linearGradient: ['fill', 'stroke'],
    marker: ['marker', 'marker-end', 'marker-mid', 'marker-start'],
    mask: NULL,
    pattern: ['fill', 'stroke'],
    radialGradient: ['fill', 'stroke']
  };
  var INJECTED = 1;
  var FAIL = 2;

  var uniqueIdCounter = 1;
  var xmlSerializer;
  var domParser;


  // creates an SVG document from an SVG string
  function svgStringToSvgDoc(svgStr) {
    domParser = domParser || new DOMParser();
    return domParser.parseFromString(svgStr, 'text/xml');
  }


  // searializes an SVG element to an SVG string
  function svgElemToSvgString(svgElement) {
    xmlSerializer = xmlSerializer || new XMLSerializer();
    return xmlSerializer.serializeToString(svgElement);
  }


  // Returns the absolute url for the specified url
  function getAbsoluteUrl(url) {
    A_ELEMENT.href = url;
    return A_ELEMENT.href;
  }


  // Load svg with an XHR request
  function loadSvg(url, callback, errorCallback) {
    if (url) {
      var req = new XMLHttpRequest();
      req.onreadystatechange = function() {
        if (req.readyState == 4) {
          // readyState is DONE
          var status = req.status;
          if (status == 200) {
            // request status is OK
            callback(req.responseXML, req.responseText.trim());
          } else if (status >= 400) {
            // request status is error (4xx or 5xx)
            errorCallback();
          } else if (status == 0) {
            // request status 0 can indicate a failed cross-domain call
            errorCallback();
          }
        }
      };
      req.open('GET', url, true);
      req.send();
    }
  }


  // Copy attributes from img element to svg element
  function copyAttributes(imgElem, svgElem) {
    var attribute;
    var attributeName;
    var attributeValue;
    var attributes = imgElem.attributes;
    for (var i = 0; i < attributes[_LENGTH_]; i++) {
      attribute = attributes[i];
      attributeName = attribute.name;
      // Only copy attributes not explicitly excluded from copying
      if (ATTRIBUTE_EXCLUSION_NAMES.indexOf(attributeName) == -1) {
        attributeValue = attribute.value;
        // If img attribute is "title", insert a title element into SVG element
        if (attributeName == _TITLE_) {
          var titleElem;
          var firstElementChild = svgElem.firstElementChild;
          if (firstElementChild && firstElementChild.localName.toLowerCase() == _TITLE_) {
            // If the SVG element's first child is a title element, keep it as the title element
            titleElem = firstElementChild;
          } else {
            // If the SVG element's first child element is not a title element, create a new title
            // ele,emt and set it as the first child
            titleElem = document[_CREATE_ELEMENT_ + 'NS']('http://www.w3.org/2000/svg', _TITLE_);
            svgElem.insertBefore(titleElem, firstElementChild);
          }
          // Set new title content
          titleElem.textContent = attributeValue;
        } else {
          // Set img attribute to svg element
          svgElem[_SET_ATTRIBUTE_](attributeName, attributeValue);
        }
      }
    }
  }


  // This function appends a suffix to IDs of referenced elements in the <defs> in order to  to avoid ID collision
  // between multiple injected SVGs. The suffix has the form "--inject-X", where X is a running number which is
  // incremented with each injection. References to the IDs are adjusted accordingly.
  // We assume tha all IDs within the injected SVG are unique, therefore the same suffix can be used for all IDs of one
  // injected SVG.
  // If the onlyReferenced argument is set to true, only those IDs will be made unique that are referenced from within the SVG
  function makeIdsUnique(svgElem, onlyReferenced) {
    var idSuffix = ID_SUFFIX + uniqueIdCounter++;
    // Regular expression for functional notations of an IRI references. This will find occurences in the form
    // url(#anyId) or url("#anyId") (for Internet Explorer) and capture the referenced ID
    var funcIriRegex = /url\("?#([a-zA-Z][\w:.-]*)"?\)/g;
    // Get all elements with an ID. The SVG spec recommends to put referenced elements inside <defs> elements, but
    // this is not a requirement, therefore we have to search for IDs in the whole SVG.
    var idElements = svgElem.querySelectorAll('[id]');
    var idElem;
    // An object containing referenced IDs  as keys is used if only referenced IDs should be uniquified.
    // If this object does not exist, all IDs will be uniquified.
    var referencedIds = onlyReferenced ? [] : NULL;
    var tagName;
    var iriTagNames = {};
    var iriProperties = [];
    var changed = false;
    var i, j;

    if (idElements[_LENGTH_]) {
      // Make all IDs unique by adding the ID suffix and collect all encountered tag names
      // that are IRI referenceable from properities.
      for (i = 0; i < idElements[_LENGTH_]; i++) {
        tagName = idElements[i].localName; // Use non-namespaced tag name
        // Make ID unique if tag name is IRI referenceable
        if (tagName in IRI_TAG_PROPERTIES_MAP) {
          iriTagNames[tagName] = 1;
        }
      }
      // Get all properties that are mapped to the found IRI referenceable tags
      for (tagName in iriTagNames) {
        (IRI_TAG_PROPERTIES_MAP[tagName] || [tagName]).forEach(function (mappedProperty) {
          // Add mapped properties to array of iri referencing properties.
          // Use linear search here because the number of possible entries is very small (maximum 11)
          if (iriProperties.indexOf(mappedProperty) < 0) {
            iriProperties.push(mappedProperty);
          }
        });
      }
      if (iriProperties[_LENGTH_]) {
        // Add "style" to properties, because it may contain references in the form 'style="fill:url(#myFill)"'
        iriProperties.push(_STYLE_);
      }
      // Run through all elements of the SVG and replace IDs in references.
      // To get all descending elements, getElementsByTagName('*') seems to perform faster than querySelectorAll('*').
      // Since svgElem.getElementsByTagName('*') does not return the svg element itself, we have to handle it separately.
      var descElements = svgElem[_GET_ELEMENTS_BY_TAG_NAME_]('*');
      var element = svgElem;
      var propertyName;
      var value;
      var newValue;
      for (i = -1; element != NULL;) {
        if (element.localName == _STYLE_) {
          // If element is a style element, replace IDs in all occurences of "url(#anyId)" in text content
          value = element.textContent;
          newValue = value && value.replace(funcIriRegex, function(match, id) {
            if (referencedIds) {
              referencedIds[id] = 1;
            }
            return 'url(#' + id + idSuffix + ')';
          });
          if (newValue !== value) {
            element.textContent = newValue;
          }
        } else if (element.hasAttributes()) {
          // Run through all property names for which IDs were found
          for (j = 0; j < iriProperties[_LENGTH_]; j++) {
            propertyName = iriProperties[j];
            value = element[_GET_ATTRIBUTE_](propertyName);
            newValue = value && value.replace(funcIriRegex, function(match, id) {
              if (referencedIds) {
                referencedIds[id] = 1;
              }
                return 'url(#' + id + idSuffix + ')';
            });
            if (newValue !== value) {
              element[_SET_ATTRIBUTE_](propertyName, newValue);
            }
          }
          // Replace IDs in xlink:ref and href attributes
          ['xlink:href', 'href'].forEach(function(refAttrName) {
            var iri = element[_GET_ATTRIBUTE_](refAttrName);
            if (/^\s*#/.test(iri)) { // Check if iri is non-null and internal reference
              iri = iri.trim();
              element[_SET_ATTRIBUTE_](refAttrName, iri + idSuffix);
              if (referencedIds) {
                // Add ID to referenced IDs
                referencedIds[iri.substring(1)] = 1;
              }
            }
          });
        }
        element = descElements[++i];
      }
      for (i = 0; i < idElements[_LENGTH_]; i++) {
        idElem = idElements[i];
        // If set of referenced IDs exists, make only referenced IDs unique,
        // otherwise make all IDs unique.
        if (!referencedIds || referencedIds[idElem.id]) {
          // Add suffix to element's ID
          idElem.id += idSuffix;
          changed = true;
        }
      }
    }
    // return true if SVG element has changed
    return changed;
  }


  // For cached SVGs the IDs are made unique by simply replacing the already inserted unique IDs with a
  // higher ID counter. This is much more performant than a call to makeIdsUnique().
  function makeIdsUniqueCached(svgString) {
    return svgString.replace(ID_SUFFIX_REGEX, ID_SUFFIX + uniqueIdCounter++);
  }


  // Inject SVG by replacing the img element with the SVG element in the DOM
  function inject(imgElem, svgElem, absUrl, options) {
    if (svgElem) {
      svgElem[_SET_ATTRIBUTE_]('data-inject-url', absUrl);
      var parentNode = imgElem.parentNode;
      if (parentNode) {
        if (options.copyAttributes) {
          copyAttributes(imgElem, svgElem);
        }
        // Invoke beforeInject hook if set
        var beforeInject = options.beforeInject;
        var injectElem = (beforeInject && beforeInject(imgElem, svgElem)) || svgElem;
        // Replace img element with new element. This is the actual injection.
        parentNode.replaceChild(injectElem, imgElem);
        // Mark img element as injected
        imgElem[__SVGINJECT] = INJECTED;
        removeOnLoadAttribute(imgElem);
        // Invoke afterInject hook if set
        var afterInject = options.afterInject;
        if (afterInject) {
          afterInject(imgElem, injectElem);
        }
      }
    } else {
      svgInvalid(imgElem, options);
    }
  }


  // Merges any number of options objects into a new object
  function mergeOptions() {
    var mergedOptions = {};
    var args = arguments;
    // Iterate over all specified options objects and add all properties to the new options object
    for (var i = 0; i < args[_LENGTH_]; i++) {
      var argument = args[i];
        for (var key in argument) {
          if (argument.hasOwnProperty(key)) {
            mergedOptions[key] = argument[key];
          }
        }
      }
    return mergedOptions;
  }


  // Adds the specified CSS to the document's <head> element
  function addStyleToHead(css) {
    var head = document[_GET_ELEMENTS_BY_TAG_NAME_]('head')[0];
    if (head) {
      var style = document[_CREATE_ELEMENT_](_STYLE_);
      style.type = 'text/css';
      style.appendChild(document.createTextNode(css));
      head.appendChild(style);
    }
  }


  // Builds an SVG element from the specified SVG string
  function buildSvgElement(svgStr, verify) {
    if (verify) {
      var svgDoc;
      try {
        // Parse the SVG string with DOMParser
        svgDoc = svgStringToSvgDoc(svgStr);
      } catch(e) {
        return NULL;
      }
      if (svgDoc[_GET_ELEMENTS_BY_TAG_NAME_]('parsererror')[_LENGTH_]) {
        // DOMParser does not throw an exception, but instead puts parsererror tags in the document
        return NULL;
      }
      return svgDoc.documentElement;
    } else {
      var div = document.createElement('div');
      div.innerHTML = svgStr;
      return div.firstElementChild;
    }
  }


  function removeOnLoadAttribute(imgElem) {
    // Remove the onload attribute. Should only be used to remove the unstyled image flash protection and
    // make the element visible, not for removing the event listener.
    imgElem.removeAttribute('onload');
  }


  function errorMessage(msg) {
    console.error('SVGInject: ' + msg);
  }


  function fail(imgElem, status, options) {
    imgElem[__SVGINJECT] = FAIL;
    if (options.onFail) {
      options.onFail(imgElem, status);
    } else {
      errorMessage(status);
    }
  }


  function svgInvalid(imgElem, options) {
    removeOnLoadAttribute(imgElem);
    fail(imgElem, SVG_INVALID, options);
  }


  function svgNotSupported(imgElem, options) {
    removeOnLoadAttribute(imgElem);
    fail(imgElem, SVG_NOT_SUPPORTED, options);
  }


  function loadFail(imgElem, options) {
    fail(imgElem, LOAD_FAIL, options);
  }


  function removeEventListeners(imgElem) {
    imgElem.onload = NULL;
    imgElem.onerror = NULL;
  }


  function imgNotSet(msg) {
    errorMessage('no img element');
  }


  function createSVGInject(globalName, options) {
    var defaultOptions = mergeOptions(DEFAULT_OPTIONS, options);
    var svgLoadCache = {};

    if (IS_SVG_SUPPORTED) {
      // If the browser supports SVG, add a small stylesheet that hides the <img> elements until
      // injection is finished. This avoids showing the unstyled SVGs before style is applied.
      addStyleToHead('img[onload^="' + globalName + '("]{visibility:hidden;}');
    }


    /**
     * SVGInject
     *
     * Injects the SVG specified in the `src` attribute of the specified `img` element or array of `img`
     * elements. Returns a Promise object which resolves if all passed in `img` elements have either been
     * injected or failed to inject (Only if a global Promise object is available like in all modern browsers
     * or through a polyfill).
     *
     * Options:
     * useCache: If set to `true` the SVG will be cached using the absolute URL. Default value is `true`.
     * copyAttributes: If set to `true` the attributes will be copied from `img` to `svg`. Dfault value
     *     is `true`.
     * makeIdsUnique: If set to `true` the ID of elements in the `<defs>` element that can be references by
     *     property values (for example 'clipPath') are made unique by appending "--inject-X", where X is a
     *     running number which increases with each injection. This is done to avoid duplicate IDs in the DOM.
     * beforeLoad: Hook before SVG is loaded. The `img` element is passed as a parameter. If the hook returns
     *     a string it is used as the URL instead of the `img` element's `src` attribute.
     * afterLoad: Hook after SVG is loaded. The loaded `svg` element and `svg` string are passed as a
     *     parameters. If caching is active this hook will only get called once for injected SVGs with the
     *     same absolute path. Changes to the `svg` element in this hook will be applied to all injected SVGs
     *     with the same absolute path. It's also possible to return an `svg` string or `svg` element which
     *     will then be used for the injection.
     * beforeInject: Hook before SVG is injected. The `img` and `svg` elements are passed as parameters. If
     *     any html element is returned it gets injected instead of applying the default SVG injection.
     * afterInject: Hook after SVG is injected. The `img` and `svg` elements are passed as parameters.
     * onAllFinish: Hook after all `img` elements passed to an SVGInject() call have either been injected or
     *     failed to inject.
     * onFail: Hook after injection fails. The `img` element and a `status` string are passed as an parameter.
     *     The `status` can be either `'SVG_NOT_SUPPORTED'` (the browser does not support SVG),
     *     `'SVG_INVALID'` (the SVG is not in a valid format) or `'LOAD_FAILED'` (loading of the SVG failed).
     *
     * @param {HTMLImageElement} img - an img element or an array of img elements
     * @param {Object} [options] - optional parameter with [options](#options) for this injection.
     */
    function SVGInject(img, options) {
      options = mergeOptions(defaultOptions, options);

      var run = function(resolve) {
        var allFinish = function() {
          var onAllFinish = options.onAllFinish;
          if (onAllFinish) {
            onAllFinish();
          }
          resolve && resolve();
        };

        if (img && typeof img[_LENGTH_] != _UNDEFINED_) {
          // an array like structure of img elements
          var injectIndex = 0;
          var injectCount = img[_LENGTH_];

          if (injectCount == 0) {
            allFinish();
          } else {
            var finish = function() {
              if (++injectIndex == injectCount) {
                allFinish();
              }
            };

            for (var i = 0; i < injectCount; i++) {
              SVGInjectElement(img[i], options, finish);
            }
          }
        } else {
          // only one img element
          SVGInjectElement(img, options, allFinish);
        }
      };

      // return a Promise object if globally available
      return typeof Promise == _UNDEFINED_ ? run() : new Promise(run);
    }


    // Injects a single svg element. Options must be already merged with the default options.
    function SVGInjectElement(imgElem, options, callback) {
      if (imgElem) {
        var svgInjectAttributeValue = imgElem[__SVGINJECT];
        if (!svgInjectAttributeValue) {
          removeEventListeners(imgElem);

          if (!IS_SVG_SUPPORTED) {
            svgNotSupported(imgElem, options);
            callback();
            return;
          }
          // Invoke beforeLoad hook if set. If the beforeLoad returns a value use it as the src for the load
          // URL path. Else use the imgElem's src attribute value.
          var beforeLoad = options.beforeLoad;
          var src = (beforeLoad && beforeLoad(imgElem)) || imgElem[_GET_ATTRIBUTE_]('src');

          if (!src) {
            // If no image src attribute is set do no injection. This can only be reached by using javascript
            // because if no src attribute is set the onload and onerror events do not get called
            if (src === '') {
              loadFail(imgElem, options);
            }
            callback();
            return;
          }

          // set array so later calls can register callbacks
          var onFinishCallbacks = [];
          imgElem[__SVGINJECT] = onFinishCallbacks;

          var onFinish = function() {
            callback();
            onFinishCallbacks.forEach(function(onFinishCallback) {
              onFinishCallback();
            });
          };

          var absUrl = getAbsoluteUrl(src);
          var useCacheOption = options.useCache;
          var makeIdsUniqueOption = options.makeIdsUnique;
          
          var setSvgLoadCacheValue = function(val) {
            if (useCacheOption) {
              svgLoadCache[absUrl].forEach(function(svgLoad) {
                svgLoad(val);
              });
              svgLoadCache[absUrl] = val;
            }
          };

          if (useCacheOption) {
            var svgLoad = svgLoadCache[absUrl];

            var handleLoadValue = function(loadValue) {
              if (loadValue === LOAD_FAIL) {
                loadFail(imgElem, options);
              } else if (loadValue === SVG_INVALID) {
                svgInvalid(imgElem, options);
              } else {
                var hasUniqueIds = loadValue[0];
                var svgString = loadValue[1];
                var uniqueIdsSvgString = loadValue[2];
                var svgElem;

                if (makeIdsUniqueOption) {
                  if (hasUniqueIds === NULL) {
                    // IDs for the SVG string have not been made unique before. This may happen if previous
                    // injection of a cached SVG have been run with the option makedIdsUnique set to false
                    svgElem = buildSvgElement(svgString, false);
                    hasUniqueIds = makeIdsUnique(svgElem, false);

                    loadValue[0] = hasUniqueIds;
                    loadValue[2] = hasUniqueIds && svgElemToSvgString(svgElem);
                  } else if (hasUniqueIds) {
                    // Make IDs unique for already cached SVGs with better performance
                    svgString = makeIdsUniqueCached(uniqueIdsSvgString);
                  }
                }

                svgElem = svgElem || buildSvgElement(svgString, false);

                inject(imgElem, svgElem, absUrl, options);
              }
              onFinish();
            };

            if (typeof svgLoad != _UNDEFINED_) {
              // Value for url exists in cache
              if (svgLoad.isCallbackQueue) {
                // Same url has been cached, but value has not been loaded yet, so add to callbacks
                svgLoad.push(handleLoadValue);
              } else {
                handleLoadValue(svgLoad);
              }
              return;
            } else {
              var svgLoad = [];
              // set property isCallbackQueue to Array to differentiate from array with cached loaded values
              svgLoad.isCallbackQueue = true;
              svgLoadCache[absUrl] = svgLoad;
            }
          }

          // Load the SVG because it is not cached or caching is disabled
          loadSvg(absUrl, function(svgXml, svgString) {
            // Use the XML from the XHR request if it is an instance of Document. Otherwise
            // (for example of IE9), create the svg document from the svg string.
            var svgElem = svgXml instanceof Document ? svgXml.documentElement : buildSvgElement(svgString, true);

            var afterLoad = options.afterLoad;
            if (afterLoad) {
              // Invoke afterLoad hook which may modify the SVG element. After load may also return a new
              // svg element or svg string
              var svgElemOrSvgString = afterLoad(svgElem, svgString) || svgElem;
              if (svgElemOrSvgString) {
                // Update svgElem and svgString because of modifications to the SVG element or SVG string in
                // the afterLoad hook, so the modified SVG is also used for all later cached injections
                var isString = typeof svgElemOrSvgString == 'string';
                svgString = isString ? svgElemOrSvgString : svgElemToSvgString(svgElem);
                svgElem = isString ? buildSvgElement(svgElemOrSvgString, true) : svgElemOrSvgString;
              }
            }

            if (svgElem instanceof SVGElement) {
              var hasUniqueIds = NULL;
              if (makeIdsUniqueOption) {
                hasUniqueIds = makeIdsUnique(svgElem, false);
              }

              if (useCacheOption) {
                var uniqueIdsSvgString = hasUniqueIds && svgElemToSvgString(svgElem);
                // set an array with three entries to the load cache
                setSvgLoadCacheValue([hasUniqueIds, svgString, uniqueIdsSvgString]);
              }

              inject(imgElem, svgElem, absUrl, options);
            } else {
              svgInvalid(imgElem, options);
              setSvgLoadCacheValue(SVG_INVALID);
            }
            onFinish();
          }, function() {
            loadFail(imgElem, options);
            setSvgLoadCacheValue(LOAD_FAIL);
            onFinish();
          });
        } else {
          if (Array.isArray(svgInjectAttributeValue)) {
            // svgInjectAttributeValue is an array. Injection is not complete so register callback
            svgInjectAttributeValue.push(callback);
          } else {
            callback();
          }
        }
      } else {
        imgNotSet();
      }
    }


    /**
     * Sets the default [options](#options) for SVGInject.
     *
     * @param {Object} [options] - default [options](#options) for an injection.
     */
    SVGInject.setOptions = function(options) {
      defaultOptions = mergeOptions(defaultOptions, options);
    };


    // Create a new instance of SVGInject
    SVGInject.create = createSVGInject;


    /**
     * Used in onerror Event of an `<img>` element to handle cases when the loading the original src fails
     * (for example if file is not found or if the browser does not support SVG). This triggers a call to the
     * options onFail hook if available. The optional second parameter will be set as the new src attribute
     * for the img element.
     *
     * @param {HTMLImageElement} img - an img element
     * @param {String} [fallbackSrc] - optional parameter fallback src
     */
    SVGInject.err = function(img, fallbackSrc) {
      if (img) {
        if (img[__SVGINJECT] != FAIL) {
          removeEventListeners(img);

          if (!IS_SVG_SUPPORTED) {
            svgNotSupported(img, defaultOptions);
          } else {
            removeOnLoadAttribute(img);
            loadFail(img, defaultOptions);
          }
          if (fallbackSrc) {
            removeOnLoadAttribute(img);
            img.src = fallbackSrc;
          }
        }
      } else {
        imgNotSet();
      }
    };

    window[globalName] = SVGInject;

    return SVGInject;
  }

  var SVGInjectInstance = createSVGInject('SVGInject');

  if ( true && typeof module.exports == 'object') {
    module.exports = SVGInjectInstance;
  }
})(window, document);

/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./src/app.css":
/*!***********************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/app.css ***!
  \***********************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../node_modules/css-loader/dist/runtime/getUrl.js */ "./node_modules/css-loader/dist/runtime/getUrl.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2__);
// Imports



var ___CSS_LOADER_URL_IMPORT_0___ = new URL(/* asset import */ __webpack_require__(/*! ./assets/fonts/Roboto_Condensed/static/RobotoCondensed-Medium.ttf */ "./src/assets/fonts/Roboto_Condensed/static/RobotoCondensed-Medium.ttf"), __webpack_require__.b);
var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
var ___CSS_LOADER_URL_REPLACEMENT_0___ = _node_modules_css_loader_dist_runtime_getUrl_js__WEBPACK_IMPORTED_MODULE_2___default()(___CSS_LOADER_URL_IMPORT_0___);
// Module
___CSS_LOADER_EXPORT___.push([module.id, `@font-face {
  /* https://fonts.google.com/specimen/Roboto+Condensed */
  font-family: 'Roboto Condensed';
  src: url(${___CSS_LOADER_URL_REPLACEMENT_0___});
  font-weight: 600;
  font-style: normal;
}

:root {
  --section-heading-text-align: center;
  --section-heading-padding: 1rem;
  --section-heading-font-size: clamp(1.5rem, 1rem + 2.5vw, 4rem);
}

*,
*::before,
*::after {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

body {
  min-height: 100svh;
  background-color: #ff9b71;
  font-family: 'Roboto Condensed', Arial;
  font-family: 'Roboto Condensed';
  font-family: Arial;
}

.icon {
  width: 32px;
  height: auto;
}
`, "",{"version":3,"sources":["webpack://./src/app.css"],"names":[],"mappings":"AAAA;EACE,uDAAuD;EACvD,+BAA+B;EAC/B,4CAA2E;EAC3E,gBAAgB;EAChB,kBAAkB;AACpB;;AAEA;EACE,oCAAoC;EACpC,+BAA+B;EAC/B,8DAA8D;AAChE;;AAEA;;;EAGE,UAAU;EACV,SAAS;EACT,sBAAsB;AACxB;;AAEA;EACE,kBAAkB;EAClB,yBAAyB;EACzB,sCAAsC;EACtC,+BAA+B;EAC/B,kBAAkB;AACpB;;AAEA;EACE,WAAW;EACX,YAAY;AACd","sourcesContent":["@font-face {\n  /* https://fonts.google.com/specimen/Roboto+Condensed */\n  font-family: 'Roboto Condensed';\n  src: url(./assets/fonts/Roboto_Condensed/static/RobotoCondensed-Medium.ttf);\n  font-weight: 600;\n  font-style: normal;\n}\n\n:root {\n  --section-heading-text-align: center;\n  --section-heading-padding: 1rem;\n  --section-heading-font-size: clamp(1.5rem, 1rem + 2.5vw, 4rem);\n}\n\n*,\n*::before,\n*::after {\n  padding: 0;\n  margin: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  min-height: 100svh;\n  background-color: #ff9b71;\n  font-family: 'Roboto Condensed', Arial;\n  font-family: 'Roboto Condensed';\n  font-family: Arial;\n}\n\n.icon {\n  width: 32px;\n  height: auto;\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./src/styles/about.css":
/*!********************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/styles/about.css ***!
  \********************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `.about_left {
  position: relative;
  display: grid;
}

.about_left > .img_about {
  display: block;
  width: 100%;
  padding: 1rem;
}

.about_left > h2 {
  font-size: 4rem;
  position: absolute;
  justify-self: center;
  align-self: end;
  margin: 2rem;
}

.about_right > h2 {
  text-align: var(--section-heading-text-align);
  padding: var(--section-heading-padding);
  font-size: var(--section-heading-font-size);
}
`, "",{"version":3,"sources":["webpack://./src/styles/about.css"],"names":[],"mappings":"AAAA;EACE,kBAAkB;EAClB,aAAa;AACf;;AAEA;EACE,cAAc;EACd,WAAW;EACX,aAAa;AACf;;AAEA;EACE,eAAe;EACf,kBAAkB;EAClB,oBAAoB;EACpB,eAAe;EACf,YAAY;AACd;;AAEA;EACE,6CAA6C;EAC7C,uCAAuC;EACvC,2CAA2C;AAC7C","sourcesContent":[".about_left {\n  position: relative;\n  display: grid;\n}\n\n.about_left > .img_about {\n  display: block;\n  width: 100%;\n  padding: 1rem;\n}\n\n.about_left > h2 {\n  font-size: 4rem;\n  position: absolute;\n  justify-self: center;\n  align-self: end;\n  margin: 2rem;\n}\n\n.about_right > h2 {\n  text-align: var(--section-heading-text-align);\n  padding: var(--section-heading-padding);\n  font-size: var(--section-heading-font-size);\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./src/styles/btn_menu.css":
/*!***********************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/styles/btn_menu.css ***!
  \***********************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `.btn_menu {
  background: none;
  border: none;
  padding: 0.25rem;
}

.btn_menu:hover {
  cursor: pointer;
}

.menu {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 32px;
  height: 32px;
  position: relative;
}

.menu_line {
  background-color: #ffffff;
  width: 50%;
  height: 4px;
  transition: transform 250ms ease-in;
}

.menu_line:nth-of-type(3) {
  width: 100%;
}

.menu_line.active:nth-of-type(1) {
  transform: rotate(45deg) translate(5px, 1px);
  transition: transform 250ms ease-out;
}

.menu_line.active:nth-of-type(2) {
  transform: rotate(-45deg) translate(-5px, 1px);
  transition: transform 250ms ease-out;
}

.menu_line.active:nth-of-type(3) {
  transform: rotate(180deg);
  opacity: 0;
  visibility: hidden;
  transition:
    transform,
    opacity,
    visibility 500ms ease-out;
}

.menu_line.active:nth-of-type(4) {
  transform: rotate(-45deg) translate(5px, -2px);
  transition: transform 250ms ease-out;
}

.menu_line.active:nth-of-type(5) {
  transform: rotate(45deg) translate(-5px, -2px);
  transition: transform 250ms ease-out;
}
`, "",{"version":3,"sources":["webpack://./src/styles/btn_menu.css"],"names":[],"mappings":"AAAA;EACE,gBAAgB;EAChB,YAAY;EACZ,gBAAgB;AAClB;;AAEA;EACE,eAAe;AACjB;;AAEA;EACE,aAAa;EACb,eAAe;EACf,mBAAmB;EACnB,WAAW;EACX,YAAY;EACZ,kBAAkB;AACpB;;AAEA;EACE,yBAAyB;EACzB,UAAU;EACV,WAAW;EACX,mCAAmC;AACrC;;AAEA;EACE,WAAW;AACb;;AAEA;EACE,4CAA4C;EAC5C,oCAAoC;AACtC;;AAEA;EACE,8CAA8C;EAC9C,oCAAoC;AACtC;;AAEA;EACE,yBAAyB;EACzB,UAAU;EACV,kBAAkB;EAClB;;;6BAG2B;AAC7B;;AAEA;EACE,8CAA8C;EAC9C,oCAAoC;AACtC;;AAEA;EACE,8CAA8C;EAC9C,oCAAoC;AACtC","sourcesContent":[".btn_menu {\n  background: none;\n  border: none;\n  padding: 0.25rem;\n}\n\n.btn_menu:hover {\n  cursor: pointer;\n}\n\n.menu {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  width: 32px;\n  height: 32px;\n  position: relative;\n}\n\n.menu_line {\n  background-color: #ffffff;\n  width: 50%;\n  height: 4px;\n  transition: transform 250ms ease-in;\n}\n\n.menu_line:nth-of-type(3) {\n  width: 100%;\n}\n\n.menu_line.active:nth-of-type(1) {\n  transform: rotate(45deg) translate(5px, 1px);\n  transition: transform 250ms ease-out;\n}\n\n.menu_line.active:nth-of-type(2) {\n  transform: rotate(-45deg) translate(-5px, 1px);\n  transition: transform 250ms ease-out;\n}\n\n.menu_line.active:nth-of-type(3) {\n  transform: rotate(180deg);\n  opacity: 0;\n  visibility: hidden;\n  transition:\n    transform,\n    opacity,\n    visibility 500ms ease-out;\n}\n\n.menu_line.active:nth-of-type(4) {\n  transform: rotate(-45deg) translate(5px, -2px);\n  transition: transform 250ms ease-out;\n}\n\n.menu_line.active:nth-of-type(5) {\n  transform: rotate(45deg) translate(-5px, -2px);\n  transition: transform 250ms ease-out;\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./src/styles/contact.css":
/*!**********************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/styles/contact.css ***!
  \**********************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `.contact {
  background-color: #fffafa;
}

.contact > :first-child > h2 {
  text-align: var(--section-heading-text-align);
  padding: var(--section-heading-padding);
  font-size: var(--section-heading-font-size);
}

.contact > * > div:not(:first-of-type) {
  display: flex;
}

.contact > * > div:not(.address) {
  align-items: center;
  gap: 1rem;
}

.contact > * > div:not(:last-of-type) {
  margin-bottom: 1rem;
}

.contact > * > .address {
  flex-direction: column;
}

.img_contact {
  width: 100%;
  height: auto;
}
`, "",{"version":3,"sources":["webpack://./src/styles/contact.css"],"names":[],"mappings":"AAAA;EACE,yBAAyB;AAC3B;;AAEA;EACE,6CAA6C;EAC7C,uCAAuC;EACvC,2CAA2C;AAC7C;;AAEA;EACE,aAAa;AACf;;AAEA;EACE,mBAAmB;EACnB,SAAS;AACX;;AAEA;EACE,mBAAmB;AACrB;;AAEA;EACE,sBAAsB;AACxB;;AAEA;EACE,WAAW;EACX,YAAY;AACd","sourcesContent":[".contact {\n  background-color: #fffafa;\n}\n\n.contact > :first-child > h2 {\n  text-align: var(--section-heading-text-align);\n  padding: var(--section-heading-padding);\n  font-size: var(--section-heading-font-size);\n}\n\n.contact > * > div:not(:first-of-type) {\n  display: flex;\n}\n\n.contact > * > div:not(.address) {\n  align-items: center;\n  gap: 1rem;\n}\n\n.contact > * > div:not(:last-of-type) {\n  margin-bottom: 1rem;\n}\n\n.contact > * > .address {\n  flex-direction: column;\n}\n\n.img_contact {\n  width: 100%;\n  height: auto;\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./src/styles/footer.css":
/*!*********************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/styles/footer.css ***!
  \*********************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `footer {
  display: flex;
  justify-content: center;
  padding: 0.5rem;
}
`, "",{"version":3,"sources":["webpack://./src/styles/footer.css"],"names":[],"mappings":"AAAA;EACE,aAAa;EACb,uBAAuB;EACvB,eAAe;AACjB","sourcesContent":["footer {\n  display: flex;\n  justify-content: center;\n  padding: 0.5rem;\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./src/styles/header.css":
/*!*********************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/styles/header.css ***!
  \*********************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `#header_primary {
  position: sticky;
  top: 0;
  right: 0;
  width: 100%;
  z-index: 1;
}

@media screen and (min-width: 768px) {
  /* Desktop */
}
`, "",{"version":3,"sources":["webpack://./src/styles/header.css"],"names":[],"mappings":"AAAA;EACE,gBAAgB;EAChB,MAAM;EACN,QAAQ;EACR,WAAW;EACX,UAAU;AACZ;;AAEA;EACE,YAAY;AACd","sourcesContent":["#header_primary {\n  position: sticky;\n  top: 0;\n  right: 0;\n  width: 100%;\n  z-index: 1;\n}\n\n@media screen and (min-width: 768px) {\n  /* Desktop */\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./src/styles/main.css":
/*!*******************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/styles/main.css ***!
  \*******************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `section {
  padding: 0rem 1rem;
  padding-bottom: 2rem;
}

a {
  position: relative;
  color: #000000;
  text-decoration: none;
  transform: translateY(0px);
  transition: transform 500ms ease-in;
}

a:not(:has(.logo))::after {
  position: absolute;
  content: '';
  width: 100%;
  height: 2px;
  bottom: 0;
  left: 0;
  background-color: #000000;
  transform: scaleX(0) translateY(9px);
  transition: transform 250ms ease-in;
}

a:hover {
  color: #ffffff;
  transform: translateY(-6px);
  transition: transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

a:hover::after {
  transform: scaleX(1) translateY(6px);
  transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
`, "",{"version":3,"sources":["webpack://./src/styles/main.css"],"names":[],"mappings":"AAAA;EACE,kBAAkB;EAClB,oBAAoB;AACtB;;AAEA;EACE,kBAAkB;EAClB,cAAc;EACd,qBAAqB;EACrB,0BAA0B;EAC1B,mCAAmC;AACrC;;AAEA;EACE,kBAAkB;EAClB,WAAW;EACX,WAAW;EACX,WAAW;EACX,SAAS;EACT,OAAO;EACP,yBAAyB;EACzB,oCAAoC;EACpC,mCAAmC;AACrC;;AAEA;EACE,cAAc;EACd,2BAA2B;EAC3B,6DAA6D;AAC/D;;AAEA;EACE,oCAAoC;EACpC,6DAA6D;AAC/D","sourcesContent":["section {\n  padding: 0rem 1rem;\n  padding-bottom: 2rem;\n}\n\na {\n  position: relative;\n  color: #000000;\n  text-decoration: none;\n  transform: translateY(0px);\n  transition: transform 500ms ease-in;\n}\n\na:not(:has(.logo))::after {\n  position: absolute;\n  content: '';\n  width: 100%;\n  height: 2px;\n  bottom: 0;\n  left: 0;\n  background-color: #000000;\n  transform: scaleX(0) translateY(9px);\n  transition: transform 250ms ease-in;\n}\n\na:hover {\n  color: #ffffff;\n  transform: translateY(-6px);\n  transition: transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1);\n}\n\na:hover::after {\n  transform: scaleX(1) translateY(6px);\n  transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./src/styles/navbar.css":
/*!*********************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/styles/navbar.css ***!
  \*********************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `nav {
  display: flex;
  justify-content: space-between;
  align-items: end;
  /* padding: 1rem 1rem 0rem 1rem; */
  padding: 1rem;
  position: relative;
  background-color: bisque;
}

nav > * {
  display: flex;
  list-style: none;
}

.nav_left > * > * {
  display: flex;
  align-items: end;
}

.logo {
  width: 48px;
  height: auto;
}

.circle {
  display: none;
}

.nav_right,
.nav_right.inactive {
  display: flex;
  visibility: hidden;
  flex-direction: column;
  align-items: end;
  gap: 1rem;
  position: fixed;
  height: 100%;
  width: 100%;
  top: 80px;
  left: 0;
  padding: 1rem;
  background-color: lightcoral;
}

.nav_right.inactive {
  transform: translateX(100%);
  transition:
    transform 250ms,
    visibility 250ms ease-in;
}

.nav_right.active {
  visibility: visible;
  transform: translateX(0%) perspective();
  transition: transform 250ms ease-out;
}

.nav_right > .nav_item > a {
  display: block;
}

@media screen and (min-width: 768px) {
  /* Desktop */
  .nav_right,
  .nav_right.active,
  .nav_right.inactive {
    visibility: visible;
    flex-direction: row;
    position: initial;
    background: none;
    width: auto;
    padding: 0;
    transform: translateX(0);
  }

  .btn_wrapper {
    display: none;
  }
}
`, "",{"version":3,"sources":["webpack://./src/styles/navbar.css"],"names":[],"mappings":"AAAA;EACE,aAAa;EACb,8BAA8B;EAC9B,gBAAgB;EAChB,kCAAkC;EAClC,aAAa;EACb,kBAAkB;EAClB,wBAAwB;AAC1B;;AAEA;EACE,aAAa;EACb,gBAAgB;AAClB;;AAEA;EACE,aAAa;EACb,gBAAgB;AAClB;;AAEA;EACE,WAAW;EACX,YAAY;AACd;;AAEA;EACE,aAAa;AACf;;AAEA;;EAEE,aAAa;EACb,kBAAkB;EAClB,sBAAsB;EACtB,gBAAgB;EAChB,SAAS;EACT,eAAe;EACf,YAAY;EACZ,WAAW;EACX,SAAS;EACT,OAAO;EACP,aAAa;EACb,4BAA4B;AAC9B;;AAEA;EACE,2BAA2B;EAC3B;;4BAE0B;AAC5B;;AAEA;EACE,mBAAmB;EACnB,uCAAuC;EACvC,oCAAoC;AACtC;;AAEA;EACE,cAAc;AAChB;;AAEA;EACE,YAAY;EACZ;;;IAGE,mBAAmB;IACnB,mBAAmB;IACnB,iBAAiB;IACjB,gBAAgB;IAChB,WAAW;IACX,UAAU;IACV,wBAAwB;EAC1B;;EAEA;IACE,aAAa;EACf;AACF","sourcesContent":["nav {\n  display: flex;\n  justify-content: space-between;\n  align-items: end;\n  /* padding: 1rem 1rem 0rem 1rem; */\n  padding: 1rem;\n  position: relative;\n  background-color: bisque;\n}\n\nnav > * {\n  display: flex;\n  list-style: none;\n}\n\n.nav_left > * > * {\n  display: flex;\n  align-items: end;\n}\n\n.logo {\n  width: 48px;\n  height: auto;\n}\n\n.circle {\n  display: none;\n}\n\n.nav_right,\n.nav_right.inactive {\n  display: flex;\n  visibility: hidden;\n  flex-direction: column;\n  align-items: end;\n  gap: 1rem;\n  position: fixed;\n  height: 100%;\n  width: 100%;\n  top: 80px;\n  left: 0;\n  padding: 1rem;\n  background-color: lightcoral;\n}\n\n.nav_right.inactive {\n  transform: translateX(100%);\n  transition:\n    transform 250ms,\n    visibility 250ms ease-in;\n}\n\n.nav_right.active {\n  visibility: visible;\n  transform: translateX(0%) perspective();\n  transition: transform 250ms ease-out;\n}\n\n.nav_right > .nav_item > a {\n  display: block;\n}\n\n@media screen and (min-width: 768px) {\n  /* Desktop */\n  .nav_right,\n  .nav_right.active,\n  .nav_right.inactive {\n    visibility: visible;\n    flex-direction: row;\n    position: initial;\n    background: none;\n    width: auto;\n    padding: 0;\n    transform: translateX(0);\n  }\n\n  .btn_wrapper {\n    display: none;\n  }\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./src/styles/projects.css":
/*!***********************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/styles/projects.css ***!
  \***********************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `.projects > h2 {
  text-align: var(--section-heading-text-align);
  padding: var(--section-heading-padding);
  font-size: var(--section-heading-font-size);
}

.projects > .articles_container {
  display: grid;
  gap: 2.5rem;
}

.projects > .articles_container > article {
  box-shadow: 0px 1px 6px -2px #000000;
}

article > .content {
  padding: 1rem 2.5rem;
  background-color: lightslategray;
}

article > .content > p {
  margin: 1rem;
}

.article_header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem;
}

.article_header::after {
  position: absolute;
  content: '';
  width: 100%;
  height: 2px;
  background-color: #000000;
  bottom: -6px;
  left: 0;
}

.article_header > h3 {
  flex-basis: 100%;
}

.article_header > a {
  display: flex;
}

article > picture > img {
  display: block;
  width: 100%;
}

.icon_project {
  width: 24px;
}
`, "",{"version":3,"sources":["webpack://./src/styles/projects.css"],"names":[],"mappings":"AAAA;EACE,6CAA6C;EAC7C,uCAAuC;EACvC,2CAA2C;AAC7C;;AAEA;EACE,aAAa;EACb,WAAW;AACb;;AAEA;EACE,oCAAoC;AACtC;;AAEA;EACE,oBAAoB;EACpB,gCAAgC;AAClC;;AAEA;EACE,YAAY;AACd;;AAEA;EACE,kBAAkB;EAClB,aAAa;EACb,mBAAmB;EACnB,YAAY;EACZ,gBAAgB;AAClB;;AAEA;EACE,kBAAkB;EAClB,WAAW;EACX,WAAW;EACX,WAAW;EACX,yBAAyB;EACzB,YAAY;EACZ,OAAO;AACT;;AAEA;EACE,gBAAgB;AAClB;;AAEA;EACE,aAAa;AACf;;AAEA;EACE,cAAc;EACd,WAAW;AACb;;AAEA;EACE,WAAW;AACb","sourcesContent":[".projects > h2 {\n  text-align: var(--section-heading-text-align);\n  padding: var(--section-heading-padding);\n  font-size: var(--section-heading-font-size);\n}\n\n.projects > .articles_container {\n  display: grid;\n  gap: 2.5rem;\n}\n\n.projects > .articles_container > article {\n  box-shadow: 0px 1px 6px -2px #000000;\n}\n\narticle > .content {\n  padding: 1rem 2.5rem;\n  background-color: lightslategray;\n}\n\narticle > .content > p {\n  margin: 1rem;\n}\n\n.article_header {\n  position: relative;\n  display: flex;\n  align-items: center;\n  gap: 0.25rem;\n  padding: 0.25rem;\n}\n\n.article_header::after {\n  position: absolute;\n  content: '';\n  width: 100%;\n  height: 2px;\n  background-color: #000000;\n  bottom: -6px;\n  left: 0;\n}\n\n.article_header > h3 {\n  flex-basis: 100%;\n}\n\n.article_header > a {\n  display: flex;\n}\n\narticle > picture > img {\n  display: block;\n  width: 100%;\n}\n\n.icon_project {\n  width: 24px;\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/cjs.js!./src/styles/socials.css":
/*!**********************************************************************!*\
  !*** ./node_modules/css-loader/dist/cjs.js!./src/styles/socials.css ***!
  \**********************************************************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/sourceMaps.js */ "./node_modules/css-loader/dist/runtime/sourceMaps.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../node_modules/css-loader/dist/runtime/api.js */ "./node_modules/css-loader/dist/runtime/api.js");
/* harmony import */ var _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1__);
// Imports


var ___CSS_LOADER_EXPORT___ = _node_modules_css_loader_dist_runtime_api_js__WEBPACK_IMPORTED_MODULE_1___default()((_node_modules_css_loader_dist_runtime_sourceMaps_js__WEBPACK_IMPORTED_MODULE_0___default()));
// Module
___CSS_LOADER_EXPORT___.push([module.id, `.socials {
  display: flex;
  justify-content: center;
  align-items: center;
  list-style: none;
  gap: 0.5rem;
  margin: 1rem;
}

.socials > * > * {
  display: flex;
}

.icon_social {
  width: 24px;
}
`, "",{"version":3,"sources":["webpack://./src/styles/socials.css"],"names":[],"mappings":"AAAA;EACE,aAAa;EACb,uBAAuB;EACvB,mBAAmB;EACnB,gBAAgB;EAChB,WAAW;EACX,YAAY;AACd;;AAEA;EACE,aAAa;AACf;;AAEA;EACE,WAAW;AACb","sourcesContent":[".socials {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  list-style: none;\n  gap: 0.5rem;\n  margin: 1rem;\n}\n\n.socials > * > * {\n  display: flex;\n}\n\n.icon_social {\n  width: 24px;\n}\n"],"sourceRoot":""}]);
// Exports
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (___CSS_LOADER_EXPORT___);


/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/api.js":
/*!*****************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/api.js ***!
  \*****************************************************/
/***/ ((module) => {

"use strict";


/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Author Tobias Koppers @sokra
*/
module.exports = function (cssWithMappingToString) {
  var list = [];

  // return the list of modules as css string
  list.toString = function toString() {
    return this.map(function (item) {
      var content = "";
      var needLayer = typeof item[5] !== "undefined";
      if (item[4]) {
        content += "@supports (".concat(item[4], ") {");
      }
      if (item[2]) {
        content += "@media ".concat(item[2], " {");
      }
      if (needLayer) {
        content += "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {");
      }
      content += cssWithMappingToString(item);
      if (needLayer) {
        content += "}";
      }
      if (item[2]) {
        content += "}";
      }
      if (item[4]) {
        content += "}";
      }
      return content;
    }).join("");
  };

  // import a list of modules into the list
  list.i = function i(modules, media, dedupe, supports, layer) {
    if (typeof modules === "string") {
      modules = [[null, modules, undefined]];
    }
    var alreadyImportedModules = {};
    if (dedupe) {
      for (var k = 0; k < this.length; k++) {
        var id = this[k][0];
        if (id != null) {
          alreadyImportedModules[id] = true;
        }
      }
    }
    for (var _k = 0; _k < modules.length; _k++) {
      var item = [].concat(modules[_k]);
      if (dedupe && alreadyImportedModules[item[0]]) {
        continue;
      }
      if (typeof layer !== "undefined") {
        if (typeof item[5] === "undefined") {
          item[5] = layer;
        } else {
          item[1] = "@layer".concat(item[5].length > 0 ? " ".concat(item[5]) : "", " {").concat(item[1], "}");
          item[5] = layer;
        }
      }
      if (media) {
        if (!item[2]) {
          item[2] = media;
        } else {
          item[1] = "@media ".concat(item[2], " {").concat(item[1], "}");
          item[2] = media;
        }
      }
      if (supports) {
        if (!item[4]) {
          item[4] = "".concat(supports);
        } else {
          item[1] = "@supports (".concat(item[4], ") {").concat(item[1], "}");
          item[4] = supports;
        }
      }
      list.push(item);
    }
  };
  return list;
};

/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/getUrl.js":
/*!********************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/getUrl.js ***!
  \********************************************************/
/***/ ((module) => {

"use strict";


module.exports = function (url, options) {
  if (!options) {
    options = {};
  }
  if (!url) {
    return url;
  }
  url = String(url.__esModule ? url.default : url);

  // If url is already wrapped in quotes, remove them
  if (/^['"].*['"]$/.test(url)) {
    url = url.slice(1, -1);
  }
  if (options.hash) {
    url += options.hash;
  }

  // Should url be wrapped?
  // See https://drafts.csswg.org/css-values-3/#urls
  if (/["'() \t\n]|(%20)/.test(url) || options.needQuotes) {
    return "\"".concat(url.replace(/"/g, '\\"').replace(/\n/g, "\\n"), "\"");
  }
  return url;
};

/***/ }),

/***/ "./node_modules/css-loader/dist/runtime/sourceMaps.js":
/*!************************************************************!*\
  !*** ./node_modules/css-loader/dist/runtime/sourceMaps.js ***!
  \************************************************************/
/***/ ((module) => {

"use strict";


module.exports = function (item) {
  var content = item[1];
  var cssMapping = item[3];
  if (!cssMapping) {
    return content;
  }
  if (typeof btoa === "function") {
    var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(cssMapping))));
    var data = "sourceMappingURL=data:application/json;charset=utf-8;base64,".concat(base64);
    var sourceMapping = "/*# ".concat(data, " */");
    return [content].concat([sourceMapping]).join("\n");
  }
  return [content].join("\n");
};

/***/ }),

/***/ "./src/app.css":
/*!*********************!*\
  !*** ./src/app.css ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_app_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../node_modules/css-loader/dist/cjs.js!./app.css */ "./node_modules/css-loader/dist/cjs.js!./src/app.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_app_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_app_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_app_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_app_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "./src/styles/about.css":
/*!******************************!*\
  !*** ./src/styles/about.css ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_about_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js!./about.css */ "./node_modules/css-loader/dist/cjs.js!./src/styles/about.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_about_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_about_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_about_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_about_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "./src/styles/btn_menu.css":
/*!*********************************!*\
  !*** ./src/styles/btn_menu.css ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_btn_menu_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js!./btn_menu.css */ "./node_modules/css-loader/dist/cjs.js!./src/styles/btn_menu.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_btn_menu_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_btn_menu_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_btn_menu_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_btn_menu_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "./src/styles/contact.css":
/*!********************************!*\
  !*** ./src/styles/contact.css ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_contact_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js!./contact.css */ "./node_modules/css-loader/dist/cjs.js!./src/styles/contact.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_contact_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_contact_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_contact_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_contact_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "./src/styles/footer.css":
/*!*******************************!*\
  !*** ./src/styles/footer.css ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_footer_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js!./footer.css */ "./node_modules/css-loader/dist/cjs.js!./src/styles/footer.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_footer_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_footer_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_footer_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_footer_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "./src/styles/header.css":
/*!*******************************!*\
  !*** ./src/styles/header.css ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_header_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js!./header.css */ "./node_modules/css-loader/dist/cjs.js!./src/styles/header.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_header_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_header_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_header_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_header_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "./src/styles/main.css":
/*!*****************************!*\
  !*** ./src/styles/main.css ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_main_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js!./main.css */ "./node_modules/css-loader/dist/cjs.js!./src/styles/main.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_main_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_main_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_main_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_main_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "./src/styles/navbar.css":
/*!*******************************!*\
  !*** ./src/styles/navbar.css ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_navbar_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js!./navbar.css */ "./node_modules/css-loader/dist/cjs.js!./src/styles/navbar.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_navbar_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_navbar_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_navbar_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_navbar_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "./src/styles/projects.css":
/*!*********************************!*\
  !*** ./src/styles/projects.css ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_projects_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js!./projects.css */ "./node_modules/css-loader/dist/cjs.js!./src/styles/projects.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_projects_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_projects_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_projects_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_projects_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "./src/styles/socials.css":
/*!********************************!*\
  !*** ./src/styles/socials.css ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js */ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleDomAPI.js */ "./node_modules/style-loader/dist/runtime/styleDomAPI.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertBySelector.js */ "./node_modules/style-loader/dist/runtime/insertBySelector.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js */ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/insertStyleElement.js */ "./node_modules/style-loader/dist/runtime/insertStyleElement.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! !../../node_modules/style-loader/dist/runtime/styleTagTransform.js */ "./node_modules/style-loader/dist/runtime/styleTagTransform.js");
/* harmony import */ var _node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _node_modules_css_loader_dist_cjs_js_socials_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! !!../../node_modules/css-loader/dist/cjs.js!./socials.css */ "./node_modules/css-loader/dist/cjs.js!./src/styles/socials.css");

      
      
      
      
      
      
      
      
      

var options = {};

options.styleTagTransform = (_node_modules_style_loader_dist_runtime_styleTagTransform_js__WEBPACK_IMPORTED_MODULE_5___default());
options.setAttributes = (_node_modules_style_loader_dist_runtime_setAttributesWithoutAttributes_js__WEBPACK_IMPORTED_MODULE_3___default());

      options.insert = _node_modules_style_loader_dist_runtime_insertBySelector_js__WEBPACK_IMPORTED_MODULE_2___default().bind(null, "head");
    
options.domAPI = (_node_modules_style_loader_dist_runtime_styleDomAPI_js__WEBPACK_IMPORTED_MODULE_1___default());
options.insertStyleElement = (_node_modules_style_loader_dist_runtime_insertStyleElement_js__WEBPACK_IMPORTED_MODULE_4___default());

var update = _node_modules_style_loader_dist_runtime_injectStylesIntoStyleTag_js__WEBPACK_IMPORTED_MODULE_0___default()(_node_modules_css_loader_dist_cjs_js_socials_css__WEBPACK_IMPORTED_MODULE_6__["default"], options);




       /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_node_modules_css_loader_dist_cjs_js_socials_css__WEBPACK_IMPORTED_MODULE_6__["default"] && _node_modules_css_loader_dist_cjs_js_socials_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals ? _node_modules_css_loader_dist_cjs_js_socials_css__WEBPACK_IMPORTED_MODULE_6__["default"].locals : undefined);


/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js":
/*!****************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/injectStylesIntoStyleTag.js ***!
  \****************************************************************************/
/***/ ((module) => {

"use strict";


var stylesInDOM = [];
function getIndexByIdentifier(identifier) {
  var result = -1;
  for (var i = 0; i < stylesInDOM.length; i++) {
    if (stylesInDOM[i].identifier === identifier) {
      result = i;
      break;
    }
  }
  return result;
}
function modulesToDom(list, options) {
  var idCountMap = {};
  var identifiers = [];
  for (var i = 0; i < list.length; i++) {
    var item = list[i];
    var id = options.base ? item[0] + options.base : item[0];
    var count = idCountMap[id] || 0;
    var identifier = "".concat(id, " ").concat(count);
    idCountMap[id] = count + 1;
    var indexByIdentifier = getIndexByIdentifier(identifier);
    var obj = {
      css: item[1],
      media: item[2],
      sourceMap: item[3],
      supports: item[4],
      layer: item[5]
    };
    if (indexByIdentifier !== -1) {
      stylesInDOM[indexByIdentifier].references++;
      stylesInDOM[indexByIdentifier].updater(obj);
    } else {
      var updater = addElementStyle(obj, options);
      options.byIndex = i;
      stylesInDOM.splice(i, 0, {
        identifier: identifier,
        updater: updater,
        references: 1
      });
    }
    identifiers.push(identifier);
  }
  return identifiers;
}
function addElementStyle(obj, options) {
  var api = options.domAPI(options);
  api.update(obj);
  var updater = function updater(newObj) {
    if (newObj) {
      if (newObj.css === obj.css && newObj.media === obj.media && newObj.sourceMap === obj.sourceMap && newObj.supports === obj.supports && newObj.layer === obj.layer) {
        return;
      }
      api.update(obj = newObj);
    } else {
      api.remove();
    }
  };
  return updater;
}
module.exports = function (list, options) {
  options = options || {};
  list = list || [];
  var lastIdentifiers = modulesToDom(list, options);
  return function update(newList) {
    newList = newList || [];
    for (var i = 0; i < lastIdentifiers.length; i++) {
      var identifier = lastIdentifiers[i];
      var index = getIndexByIdentifier(identifier);
      stylesInDOM[index].references--;
    }
    var newLastIdentifiers = modulesToDom(newList, options);
    for (var _i = 0; _i < lastIdentifiers.length; _i++) {
      var _identifier = lastIdentifiers[_i];
      var _index = getIndexByIdentifier(_identifier);
      if (stylesInDOM[_index].references === 0) {
        stylesInDOM[_index].updater();
        stylesInDOM.splice(_index, 1);
      }
    }
    lastIdentifiers = newLastIdentifiers;
  };
};

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/insertBySelector.js":
/*!********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertBySelector.js ***!
  \********************************************************************/
/***/ ((module) => {

"use strict";


var memo = {};

/* istanbul ignore next  */
function getTarget(target) {
  if (typeof memo[target] === "undefined") {
    var styleTarget = document.querySelector(target);

    // Special case to return head of iframe instead of iframe itself
    if (window.HTMLIFrameElement && styleTarget instanceof window.HTMLIFrameElement) {
      try {
        // This will throw an exception if access to iframe is blocked
        // due to cross-origin restrictions
        styleTarget = styleTarget.contentDocument.head;
      } catch (e) {
        // istanbul ignore next
        styleTarget = null;
      }
    }
    memo[target] = styleTarget;
  }
  return memo[target];
}

/* istanbul ignore next  */
function insertBySelector(insert, style) {
  var target = getTarget(insert);
  if (!target) {
    throw new Error("Couldn't find a style target. This probably means that the value for the 'insert' parameter is invalid.");
  }
  target.appendChild(style);
}
module.exports = insertBySelector;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/insertStyleElement.js":
/*!**********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/insertStyleElement.js ***!
  \**********************************************************************/
/***/ ((module) => {

"use strict";


/* istanbul ignore next  */
function insertStyleElement(options) {
  var element = document.createElement("style");
  options.setAttributes(element, options.attributes);
  options.insert(element, options.options);
  return element;
}
module.exports = insertStyleElement;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js":
/*!**********************************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/setAttributesWithoutAttributes.js ***!
  \**********************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";


/* istanbul ignore next  */
function setAttributesWithoutAttributes(styleElement) {
  var nonce =  true ? __webpack_require__.nc : 0;
  if (nonce) {
    styleElement.setAttribute("nonce", nonce);
  }
}
module.exports = setAttributesWithoutAttributes;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/styleDomAPI.js":
/*!***************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleDomAPI.js ***!
  \***************************************************************/
/***/ ((module) => {

"use strict";


/* istanbul ignore next  */
function apply(styleElement, options, obj) {
  var css = "";
  if (obj.supports) {
    css += "@supports (".concat(obj.supports, ") {");
  }
  if (obj.media) {
    css += "@media ".concat(obj.media, " {");
  }
  var needLayer = typeof obj.layer !== "undefined";
  if (needLayer) {
    css += "@layer".concat(obj.layer.length > 0 ? " ".concat(obj.layer) : "", " {");
  }
  css += obj.css;
  if (needLayer) {
    css += "}";
  }
  if (obj.media) {
    css += "}";
  }
  if (obj.supports) {
    css += "}";
  }
  var sourceMap = obj.sourceMap;
  if (sourceMap && typeof btoa !== "undefined") {
    css += "\n/*# sourceMappingURL=data:application/json;base64,".concat(btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))), " */");
  }

  // For old IE
  /* istanbul ignore if  */
  options.styleTagTransform(css, styleElement, options.options);
}
function removeStyleElement(styleElement) {
  // istanbul ignore if
  if (styleElement.parentNode === null) {
    return false;
  }
  styleElement.parentNode.removeChild(styleElement);
}

/* istanbul ignore next  */
function domAPI(options) {
  if (typeof document === "undefined") {
    return {
      update: function update() {},
      remove: function remove() {}
    };
  }
  var styleElement = options.insertStyleElement(options);
  return {
    update: function update(obj) {
      apply(styleElement, options, obj);
    },
    remove: function remove() {
      removeStyleElement(styleElement);
    }
  };
}
module.exports = domAPI;

/***/ }),

/***/ "./node_modules/style-loader/dist/runtime/styleTagTransform.js":
/*!*********************************************************************!*\
  !*** ./node_modules/style-loader/dist/runtime/styleTagTransform.js ***!
  \*********************************************************************/
/***/ ((module) => {

"use strict";


/* istanbul ignore next  */
function styleTagTransform(css, styleElement) {
  if (styleElement.styleSheet) {
    styleElement.styleSheet.cssText = css;
  } else {
    while (styleElement.firstChild) {
      styleElement.removeChild(styleElement.firstChild);
    }
    styleElement.appendChild(document.createTextNode(css));
  }
}
module.exports = styleTagTransform;

/***/ }),

/***/ "./src/app.js":
/*!********************!*\
  !*** ./src/app.js ***!
  \********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _iconfu_svg_inject__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @iconfu/svg-inject */ "./node_modules/@iconfu/svg-inject/dist/svg-inject.js");
/* harmony import */ var _iconfu_svg_inject__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_iconfu_svg_inject__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _app_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./app.css */ "./src/app.css");
/* harmony import */ var _components_header_header__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./components/header/header */ "./src/components/header/header.js");
/* harmony import */ var _components_main_main__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./components/main/main */ "./src/components/main/main.js");
/* harmony import */ var _components_footer_footer__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./components/footer/footer */ "./src/components/footer/footer.js");






(() => {
  const build = {
    header: _components_header_header__WEBPACK_IMPORTED_MODULE_2__["default"],
    main: _components_main_main__WEBPACK_IMPORTED_MODULE_3__["default"],
    footer: _components_footer_footer__WEBPACK_IMPORTED_MODULE_4__["default"],
  };

  const app = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      // Render loading screen while building app.js
      // Remove loading screen when building is complete
      document.body.appendChild(build.header());
      document.body.appendChild(build.main());
      document.body.appendChild(build.footer());
    },
  };

  app.render();
})();


/***/ }),

/***/ "./src/components/about/about.config.js":
/*!**********************************************!*\
  !*** ./src/components/about/about.config.js ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _socials_socials__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../socials/socials */ "./src/components/socials/socials.js");
/* harmony import */ var _assets_images_matthew_henry_U5rMrSI7Pn4_unsplash_4951_3301_jpg__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_4951_3301.jpg */ "./src/assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_4951_3301.jpg");
/* harmony import */ var _assets_images_matthew_henry_U5rMrSI7Pn4_unsplash_2400_1600_jpg__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_2400_1600.jpg */ "./src/assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_2400_1600.jpg");
/* harmony import */ var _assets_images_matthew_henry_U5rMrSI7Pn4_unsplash_1920_1280_jpg__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_1920_1280.jpg */ "./src/assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_1920_1280.jpg");
/* harmony import */ var _assets_images_matthew_henry_U5rMrSI7Pn4_unsplash_640_427_jpg__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_640_427.jpg */ "./src/assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_640_427.jpg");






/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  element: 'section',
  attributes: {
    class: 'about',
  },
  children: [
    {
      element: 'div',
      attributes: {
        class: 'about_container',
      },
      children: [
        {
          element: 'div',
          attributes: {
            class: 'about_left',
          },
          children: [
            {
              element: 'img',
              attributes: {
                class: 'img_about',
                src: _assets_images_matthew_henry_U5rMrSI7Pn4_unsplash_4951_3301_jpg__WEBPACK_IMPORTED_MODULE_1__,
                srcset: `${_assets_images_matthew_henry_U5rMrSI7Pn4_unsplash_640_427_jpg__WEBPACK_IMPORTED_MODULE_4__} 640w, ${_assets_images_matthew_henry_U5rMrSI7Pn4_unsplash_1920_1280_jpg__WEBPACK_IMPORTED_MODULE_3__} 1920w, ${_assets_images_matthew_henry_U5rMrSI7Pn4_unsplash_2400_1600_jpg__WEBPACK_IMPORTED_MODULE_2__} 2400w, ${_assets_images_matthew_henry_U5rMrSI7Pn4_unsplash_4951_3301_jpg__WEBPACK_IMPORTED_MODULE_1__} 4951w`,
                sizes:
                  '(max-width: 700px) 640px, (max-width: 1920px) 1920px, (max-width: 2400px) 2400px, 4951px',
              },
            },

            {
              element: 'h2',
              attributes: {
                id: 'about',
                textContent: 'John Doe',
              },
            },
          ],
        },
        {
          element: 'div',
          attributes: {
            class: 'about_right',
          },
          children: [
            {
              element: 'h2',
              attributes: {
                textContent: 'About me',
              },
            },
            {
              element: 'p',
              attributes: {
                textContent:
                  'Pellentesque convallis ornare libero id vehicula. Mauris quis leo a nisl pellentesque fringilla sit amet at risus. Nullam mauris orci, sodales eu fermentum sed, ornare ac nisl. Fusce quis libero vulputate, pellentesque sapien sed, mattis elit. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos.',
              },
            },
            (0,_socials_socials__WEBPACK_IMPORTED_MODULE_0__["default"])(),
          ],
        },
      ],
    },
  ],
});


/***/ }),

/***/ "./src/components/about/about.js":
/*!***************************************!*\
  !*** ./src/components/about/about.js ***!
  \***************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _helpers_createElement__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../helpers/createElement */ "./src/helpers/createElement.js");
/* harmony import */ var _about_config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./about.config */ "./src/components/about/about.config.js");
/* harmony import */ var _styles_about_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../styles/about.css */ "./src/styles/about.css");




/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (() => {
  const about = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const aboutSection = (0,_helpers_createElement__WEBPACK_IMPORTED_MODULE_0__["default"])(_about_config__WEBPACK_IMPORTED_MODULE_1__["default"].element, _about_config__WEBPACK_IMPORTED_MODULE_1__["default"].attributes);
      aboutSection.setChildren(_about_config__WEBPACK_IMPORTED_MODULE_1__["default"].children);
      return aboutSection;
    },
  };

  return about.render();
});


/***/ }),

/***/ "./src/components/buttons/menu/btn_menu.config.js":
/*!********************************************************!*\
  !*** ./src/components/buttons/menu/btn_menu.config.js ***!
  \********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  element: 'button',
  attributes: {
    class: 'btn_menu',
    ['aria-pressed']: false,
  },
  children: [
    {
      element: 'div',
      attributes: {
        class: 'menu',
      },
      children: [
        // {
        //   element: 'span',
        //   attributes: {
        //     class: 'menu_line one',
        //   },
        // },
        // {
        //   element: 'span',
        //   attributes: {
        //     class: 'menu_line two',
        //   },
        // },
        // {
        //   element: 'span',
        //   attributes: {
        //     class: 'menu_line three',
        //   },
        // },
        {
          element: 'span',
          attributes: {
            class: 'menu_line',
          },
        },
        {
          element: 'span',
          attributes: {
            class: 'menu_line',
          },
        },
        {
          element: 'span',
          attributes: {
            class: 'menu_line',
          },
        },
        {
          element: 'span',
          attributes: {
            class: 'menu_line',
          },
        },
        {
          element: 'span',
          attributes: {
            class: 'menu_line',
          },
        },
      ],
    },
  ],
});


/***/ }),

/***/ "./src/components/buttons/menu/btn_menu.js":
/*!*************************************************!*\
  !*** ./src/components/buttons/menu/btn_menu.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _helpers_createElement__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../../helpers/createElement */ "./src/helpers/createElement.js");
/* harmony import */ var _btn_menu_config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./btn_menu.config */ "./src/components/buttons/menu/btn_menu.config.js");
/* harmony import */ var _helpers_pubSub__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../helpers/pubSub */ "./src/helpers/pubSub.js");
/* harmony import */ var _styles_btn_menu_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../../styles/btn_menu.css */ "./src/styles/btn_menu.css");





/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (() => {
  const menuButton = {
    init() {
      this.clickHandler = this.clickHandler.bind(this);
    },
    cacheDOM(element) {
      this.menuBtn = element;
      this.menuLines = element.querySelectorAll('.menu_line');
    },
    bindEvents() {
      this.menuBtn.addEventListener('click', this.clickHandler);
    },
    render() {
      const { element, attributes, children } = _btn_menu_config__WEBPACK_IMPORTED_MODULE_1__["default"];
      const button = (0,_helpers_createElement__WEBPACK_IMPORTED_MODULE_0__["default"])(element, attributes);
      button.setChildren(children);

      this.cacheDOM(button);
      this.bindEvents();
      return button;
    },
    clickHandler(e) {
      console.log(`clickHandler firing from btn_menu.js`);
      const btn = e.currentTarget;
      const isPressed = btn.ariaPressed === 'true';
      const toggle = isPressed ? false : true;
      btn.ariaPressed = toggle;
      [...this.menuLines].forEach((menuLine) => {
        if (toggle) {
          // menuLine.classList.remove('inactive');
          menuLine.classList.add('active');
        } else {
          // menuLine.classList.add('inactive');
          menuLine.classList.remove('active');
        }
      });
      _helpers_pubSub__WEBPACK_IMPORTED_MODULE_2__["default"].publish('toggleMenu', toggle);
    },
  };

  menuButton.init();
  return menuButton.render();
});


/***/ }),

/***/ "./src/components/contact/contact.config.js":
/*!**************************************************!*\
  !*** ./src/components/contact/contact.config.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _assets_icons_phone_classic_svg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../assets/icons/phone_classic.svg */ "./src/assets/icons/phone_classic.svg");
/* harmony import */ var _assets_icons_email_svg__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../assets/icons/email.svg */ "./src/assets/icons/email.svg");
/* harmony import */ var _assets_icons_placeholder_undraw_personal_text_re_vqj3_svg__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../assets/icons/placeholder/undraw_personal_text_re_vqj3.svg */ "./src/assets/icons/placeholder/undraw_personal_text_re_vqj3.svg");
/* harmony import */ var _socials_socials__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../socials/socials */ "./src/components/socials/socials.js");





/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  element: 'section',
  attributes: {
    class: 'contact',
  },
  children: [
    {
      element: 'div',
      children: [
        {
          element: 'h2',
          attributes: {
            id: 'contact',
            textContent: 'Contact me',
          },
        },
        {
          element: 'div',
          children: [
            {
              element: 'p',
              attributes: {
                textContent: 'Morbi tincidunt dolor ac sapien facilisis, nec laoreet mi consequat.',
              },
            },
          ],
        },
        {
          element: 'div',
          attributes: {
            class: 'address',
          },
          children: [
            {
              element: 'p',
              attributes: {
                textContent: '1234 Random Road',
              },
            },
            {
              element: 'p',
              attributes: {
                textContent: 'Random Town, Tyria 12345',
              },
            },
          ],
        },
        {
          element: 'div',
          attributes: {
            class: 'phone',
          },
          children: [
            {
              element: 'img',
              attributes: {
                class: 'icon icon_contact',
                src: _assets_icons_phone_classic_svg__WEBPACK_IMPORTED_MODULE_0__,
                onload: 'SVGInject(this)',
              },
            },
            {
              element: 'p',
              attributes: {
                textContent: '555-555-5555',
              },
            },
          ],
        },
        {
          element: 'div',
          attributes: {
            class: 'email',
          },
          children: [
            {
              element: 'img',
              attributes: {
                class: 'icon icon_contact',
                src: _assets_icons_email_svg__WEBPACK_IMPORTED_MODULE_1__,
                onload: 'SVGInject(this)',
              },
            },
            {
              element: 'p',
              attributes: {
                textContent: 'placeholder_email@gmail.com',
              },
            },
          ],
        },
        (0,_socials_socials__WEBPACK_IMPORTED_MODULE_3__["default"])(),
      ],
    },
    {
      element: 'div',
      children: [
        {
          element: 'img',
          attributes: {
            class: 'img_contact',
            src: _assets_icons_placeholder_undraw_personal_text_re_vqj3_svg__WEBPACK_IMPORTED_MODULE_2__,
            onload: 'SVGInject(this)',
          },
        },
      ],
    },
  ],
});


/***/ }),

/***/ "./src/components/contact/contact.js":
/*!*******************************************!*\
  !*** ./src/components/contact/contact.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _helpers_createElement__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../helpers/createElement */ "./src/helpers/createElement.js");
/* harmony import */ var _contact_config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./contact.config */ "./src/components/contact/contact.config.js");
/* harmony import */ var _styles_contact_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../styles/contact.css */ "./src/styles/contact.css");




/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (() => {
  const contact = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const contactSection = (0,_helpers_createElement__WEBPACK_IMPORTED_MODULE_0__["default"])(_contact_config__WEBPACK_IMPORTED_MODULE_1__["default"].element, _contact_config__WEBPACK_IMPORTED_MODULE_1__["default"].attributes);
      contactSection.setChildren(_contact_config__WEBPACK_IMPORTED_MODULE_1__["default"].children);
      return contactSection;
    },
  };

  return contact.render();
});


/***/ }),

/***/ "./src/components/footer/footer.js":
/*!*****************************************!*\
  !*** ./src/components/footer/footer.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _helpers_createElement__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../helpers/createElement */ "./src/helpers/createElement.js");
/* harmony import */ var _styles_footer_css__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../styles/footer.css */ "./src/styles/footer.css");



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (() => {
  const footer = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const footer = (0,_helpers_createElement__WEBPACK_IMPORTED_MODULE_0__["default"])('footer');
      const footerWrapper = (0,_helpers_createElement__WEBPACK_IMPORTED_MODULE_0__["default"])('div', { textContent: 'Placeholder' });
      footer.appendChild(footerWrapper);
      return footer;
    },
  };

  return footer.render();
});


/***/ }),

/***/ "./src/components/header/header.js":
/*!*****************************************!*\
  !*** ./src/components/header/header.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _helpers_createElement__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../helpers/createElement */ "./src/helpers/createElement.js");
/* harmony import */ var _navbar_navbar__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../navbar/navbar */ "./src/components/navbar/navbar.js");
/* harmony import */ var _styles_header_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../styles/header.css */ "./src/styles/header.css");




/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (() => {
  const header = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const header = (0,_helpers_createElement__WEBPACK_IMPORTED_MODULE_0__["default"])('header');
      header.id = 'header_primary';
      header.appendChild((0,_navbar_navbar__WEBPACK_IMPORTED_MODULE_1__["default"])());

      return header;
    },
  };

  return header.render();
});


/***/ }),

/***/ "./src/components/main/main.js":
/*!*************************************!*\
  !*** ./src/components/main/main.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _helpers_createElement__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../helpers/createElement */ "./src/helpers/createElement.js");
/* harmony import */ var _about_about__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../about/about */ "./src/components/about/about.js");
/* harmony import */ var _projects_projects__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../projects/projects */ "./src/components/projects/projects.js");
/* harmony import */ var _contact_contact__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../contact/contact */ "./src/components/contact/contact.js");
/* harmony import */ var _styles_main_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../../styles/main.css */ "./src/styles/main.css");






/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (() => {
  const build = {
    about: _about_about__WEBPACK_IMPORTED_MODULE_1__["default"],
    projects: _projects_projects__WEBPACK_IMPORTED_MODULE_2__["default"],
    contact: _contact_contact__WEBPACK_IMPORTED_MODULE_3__["default"],
  };

  const main = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const main = (0,_helpers_createElement__WEBPACK_IMPORTED_MODULE_0__["default"])('main');
      main.appendChild(build.about());
      main.appendChild(build.projects());
      main.appendChild(build.contact());
      return main;
    },
  };

  return main.render();
});


/***/ }),

/***/ "./src/components/navbar/navbar.config.js":
/*!************************************************!*\
  !*** ./src/components/navbar/navbar.config.js ***!
  \************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _buttons_menu_btn_menu__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../buttons/menu/btn_menu */ "./src/components/buttons/menu/btn_menu.js");
/* harmony import */ var _assets_icons_placeholder_undraw_male_avatar_g98d_svg__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../assets/icons/placeholder/undraw_male_avatar_g98d.svg */ "./src/assets/icons/placeholder/undraw_male_avatar_g98d.svg");



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  element: 'nav',
  children: [
    {
      element: 'ul',
      attributes: {
        class: 'nav_left',
      },
      children: [
        {
          element: 'li',
          attributes: {
            class: 'nav_item',
          },
          children: [
            {
              element: 'a',
              attributes: {
                href: '#',
              },
              children: [
                {
                  element: 'img',
                  attributes: {
                    class: 'logo',
                    src: _assets_icons_placeholder_undraw_male_avatar_g98d_svg__WEBPACK_IMPORTED_MODULE_1__,
                    onload: 'SVGInject(this)',
                  },
                },
                {
                  element: 'h1',
                  attributes: {
                    textContent: 'John Doe',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      element: 'ul',
      attributes: {
        class: 'nav_right',
      },
      children: [
        {
          element: 'li',
          attributes: {
            class: 'nav_item',
          },
          children: [
            {
              element: 'a',
              attributes: {
                href: '#about',
                textContent: 'About',
              },
            },
          ],
        },
        {
          element: 'li',
          attributes: {
            class: 'nav_item',
          },
          children: [
            {
              element: 'a',
              attributes: {
                href: '#projects',
                textContent: 'Projects',
              },
            },
          ],
        },
        {
          element: 'li',
          attributes: {
            class: 'nav_item',
          },
          children: [
            {
              element: 'a',
              attributes: {
                href: '#contact',
                textContent: 'Contact',
              },
            },
          ],
        },
      ],
    },
    {
      element: 'div',
      attributes: {
        class: 'btn_wrapper',
      },
      children: [(0,_buttons_menu_btn_menu__WEBPACK_IMPORTED_MODULE_0__["default"])()],
    },
  ],
});


/***/ }),

/***/ "./src/components/navbar/navbar.js":
/*!*****************************************!*\
  !*** ./src/components/navbar/navbar.js ***!
  \*****************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _navbar_config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./navbar.config */ "./src/components/navbar/navbar.config.js");
/* harmony import */ var _helpers_createElement__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../helpers/createElement */ "./src/helpers/createElement.js");
/* harmony import */ var _helpers_pubSub__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../helpers/pubSub */ "./src/helpers/pubSub.js");
/* harmony import */ var _styles_navbar_css__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../../styles/navbar.css */ "./src/styles/navbar.css");





/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (() => {
  const navbar = {
    init() {
      this.toggleMenu = this.toggleMenu.bind(this);
    },
    cacheDOM(element) {
      // this.menuBtn = element.querySelector('.btn_menu');
      this.navRight = element.querySelector('.nav_right');
    },
    bindEvents() {
      _helpers_pubSub__WEBPACK_IMPORTED_MODULE_2__["default"].subscribe('toggleMenu', this.toggleMenu);
      // this.menuBtn.addEventListener('click', this.toggleMenu);
    },
    render() {
      const { element, children } = _navbar_config__WEBPACK_IMPORTED_MODULE_0__["default"];
      const nav = (0,_helpers_createElement__WEBPACK_IMPORTED_MODULE_1__["default"])(element);
      nav.setChildren(children);

      this.cacheDOM(nav);
      this.bindEvents();
      return nav;
    },
    toggleMenu(toggle) {
      console.log(`toggleMenu published from btn_menu.js`);
      // this.navRight.classList.add('')
      console.log(toggle);
      this.navRight.classList.remove(toggle ? 'inactive' : 'active');
      this.navRight.classList.add(toggle ? 'active' : 'inactive');
    },
  };

  navbar.init();
  return navbar.render();
});


/***/ }),

/***/ "./src/components/projects/projects.config.js":
/*!****************************************************!*\
  !*** ./src/components/projects/projects.config.js ***!
  \****************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _assets_icons_github_mark_github_mark_white_svg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../assets/icons/github_mark/github-mark-white.svg */ "./src/assets/icons/github_mark/github-mark-white.svg");
/* harmony import */ var _assets_icons_open_in_new_svg__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../assets/icons/open_in_new.svg */ "./src/assets/icons/open_in_new.svg");



/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  element: 'section',
  attributes: {
    class: 'projects',
  },
  children: [
    {
      element: 'h2',
      attributes: {
        id: 'projects',
        textContent: 'Projects',
      },
    },
    {
      element: 'div',
      attributes: {
        class: 'articles_container',
      },
      children: [
        {
          element: 'article',
          children: [
            {
              element: 'picture',
              children: [
                {
                  element: 'img',
                  attributes: {
                    src: 'https://placehold.co/600x400',
                  },
                },
              ],
            },
            {
              element: 'div',
              attributes: {
                class: 'content',
              },
              children: [
                {
                  element: 'header',
                  attributes: {
                    class: 'article_header',
                  },
                  children: [
                    {
                      element: 'h3',
                      attributes: {
                        textContent: 'Project00',
                      },
                    },
                    {
                      element: 'a',
                      attributes: {
                        href: '#',
                      },
                      children: [
                        {
                          element: 'img',
                          attributes: {
                            class: 'icon icon_project',
                            src: _assets_icons_github_mark_github_mark_white_svg__WEBPACK_IMPORTED_MODULE_0__,
                            onload: 'SVGInject(this)',
                          },
                        },
                      ],
                    },
                    {
                      element: 'a',
                      attributes: {
                        href: '#',
                      },
                      children: [
                        {
                          element: 'img',
                          attributes: {
                            class: 'icon icon_project',
                            src: _assets_icons_open_in_new_svg__WEBPACK_IMPORTED_MODULE_1__,
                            onload: 'SVGInject(this)',
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  element: 'p',
                  attributes: {
                    textContent:
                      'Maecenas fermentum purus diam, a gravida nunc mattis ac. Nulla volutpat lectus odio, in consectetur felis ultricies id. Nulla ex justo, sollicitudin ac faucibus eu, porttitor nec tortor. Nunc sit amet sapien ex.',
                  },
                },
              ],
            },
          ],
        },
        {
          element: 'article',
          children: [
            {
              element: 'picture',
              children: [
                {
                  element: 'img',
                  attributes: {
                    src: 'https://placehold.co/600x400',
                  },
                },
              ],
            },
            {
              element: 'div',
              attributes: {
                class: 'content',
              },
              children: [
                {
                  element: 'header',
                  attributes: {
                    class: 'article_header',
                  },
                  children: [
                    {
                      element: 'h3',
                      attributes: {
                        textContent: 'Project01',
                      },
                    },
                    {
                      element: 'a',
                      attributes: {
                        href: '#',
                      },
                      children: [
                        {
                          element: 'img',
                          attributes: {
                            class: 'icon icon_project',
                            src: _assets_icons_github_mark_github_mark_white_svg__WEBPACK_IMPORTED_MODULE_0__,
                            onload: 'SVGInject(this)',
                          },
                        },
                      ],
                    },
                    {
                      element: 'a',
                      attributes: {
                        href: '#',
                      },
                      children: [
                        {
                          element: 'img',
                          attributes: {
                            class: 'icon icon_project',
                            src: _assets_icons_open_in_new_svg__WEBPACK_IMPORTED_MODULE_1__,
                            onload: 'SVGInject(this)',
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  element: 'p',
                  attributes: {
                    textContent:
                      'Nulla scelerisque felis vel nibh sagittis sollicitudin. Morbi urna lacus, ullamcorper et aliquet et, mollis vestibulum elit. Sed vitae ornare lectus. Nam quis mattis metus.',
                  },
                },
              ],
            },
          ],
        },
        {
          element: 'article',
          children: [
            {
              element: 'picture',
              children: [
                {
                  element: 'img',
                  attributes: {
                    src: 'https://placehold.co/600x400',
                  },
                },
              ],
            },
            {
              element: 'div',
              attributes: {
                class: 'content',
              },
              children: [
                {
                  element: 'header',
                  attributes: {
                    class: 'article_header',
                  },
                  children: [
                    {
                      element: 'h3',
                      attributes: {
                        textContent: 'Project02',
                      },
                    },
                    {
                      element: 'a',
                      attributes: {
                        href: '#',
                      },
                      children: [
                        {
                          element: 'img',
                          attributes: {
                            class: 'icon icon_project',
                            src: _assets_icons_github_mark_github_mark_white_svg__WEBPACK_IMPORTED_MODULE_0__,
                            onload: 'SVGInject(this)',
                          },
                        },
                      ],
                    },
                    {
                      element: 'a',
                      attributes: {
                        href: '#',
                      },
                      children: [
                        {
                          element: 'img',
                          attributes: {
                            class: 'icon icon_project',
                            src: _assets_icons_open_in_new_svg__WEBPACK_IMPORTED_MODULE_1__,
                            onload: 'SVGInject(this)',
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  element: 'p',
                  attributes: {
                    textContent:
                      'Donec ac ullamcorper odio, tristique laoreet tellus. Nulla tempor enim lorem, ac iaculis urna pulvinar non. Ut finibus nisi mauris. Integer dignissim nisi nec sapien cursus posuere. Ut et ipsum nisi. In vel elit nulla.',
                  },
                },
              ],
            },
          ],
        },
        {
          element: 'article',
          children: [
            {
              element: 'picture',
              children: [
                {
                  element: 'img',
                  attributes: {
                    src: 'https://placehold.co/600x400',
                  },
                },
              ],
            },
            {
              element: 'div',
              attributes: {
                class: 'content',
              },
              children: [
                {
                  element: 'header',
                  attributes: {
                    class: 'article_header',
                  },
                  children: [
                    {
                      element: 'h3',
                      attributes: {
                        textContent: 'Project03',
                      },
                    },
                    {
                      element: 'a',
                      attributes: {
                        href: '#',
                      },
                      children: [
                        {
                          element: 'img',
                          attributes: {
                            class: 'icon icon_project',
                            src: _assets_icons_github_mark_github_mark_white_svg__WEBPACK_IMPORTED_MODULE_0__,
                            onload: 'SVGInject(this)',
                          },
                        },
                      ],
                    },
                    {
                      element: 'a',
                      attributes: {
                        href: '#',
                      },
                      children: [
                        {
                          element: 'img',
                          attributes: {
                            class: 'icon icon_project',
                            src: _assets_icons_open_in_new_svg__WEBPACK_IMPORTED_MODULE_1__,
                            onload: 'SVGInject(this)',
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  element: 'p',
                  attributes: {
                    textContent:
                      'Suspendisse ornare rhoncus tincidunt. Suspendisse vulputate aliquam eros in blandit. Pellentesque sed tempor dolor. Donec eleifend, augue sit amet tincidunt ornare, lacus lorem malesuada metus, nec suscipit dolor tortor non eros.',
                  },
                },
              ],
            },
          ],
        },
        {
          element: 'article',
          children: [
            {
              element: 'picture',
              children: [
                {
                  element: 'img',
                  attributes: {
                    src: 'https://placehold.co/600x400',
                  },
                },
              ],
            },
            {
              element: 'div',
              attributes: {
                class: 'content',
              },
              children: [
                {
                  element: 'header',
                  attributes: {
                    class: 'article_header',
                  },
                  children: [
                    {
                      element: 'h3',
                      attributes: {
                        textContent: 'Project04',
                      },
                    },
                    {
                      element: 'a',
                      attributes: {
                        href: '#',
                      },
                      children: [
                        {
                          element: 'img',
                          attributes: {
                            class: 'icon icon_project',
                            src: _assets_icons_github_mark_github_mark_white_svg__WEBPACK_IMPORTED_MODULE_0__,
                            onload: 'SVGInject(this)',
                          },
                        },
                      ],
                    },
                    {
                      element: 'a',
                      attributes: {
                        href: '#',
                      },
                      children: [
                        {
                          element: 'img',
                          attributes: {
                            class: 'icon icon_project',
                            src: _assets_icons_open_in_new_svg__WEBPACK_IMPORTED_MODULE_1__,
                            onload: 'SVGInject(this)',
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  element: 'p',
                  attributes: {
                    textContent:
                      'Interdum et malesuada fames ac ante ipsum primis in faucibus. Curabitur faucibus magna quis magna blandit, sed ultricies felis ornare. Maecenas vestibulum ac magna nec fermentum.',
                  },
                },
              ],
            },
          ],
        },
        {
          element: 'article',
          children: [
            {
              element: 'picture',
              children: [
                {
                  element: 'img',
                  attributes: {
                    src: 'https://placehold.co/600x400',
                  },
                },
              ],
            },
            {
              element: 'div',
              attributes: {
                class: 'content',
              },
              children: [
                {
                  element: 'header',
                  attributes: {
                    class: 'article_header',
                  },
                  children: [
                    {
                      element: 'h3',
                      attributes: {
                        textContent: 'Project05',
                      },
                    },
                    {
                      element: 'a',
                      attributes: {
                        href: '#',
                      },
                      children: [
                        {
                          element: 'img',
                          attributes: {
                            class: 'icon icon_project',
                            src: _assets_icons_github_mark_github_mark_white_svg__WEBPACK_IMPORTED_MODULE_0__,
                            onload: 'SVGInject(this)',
                          },
                        },
                      ],
                    },
                    {
                      element: 'a',
                      attributes: {
                        href: '#',
                      },
                      children: [
                        {
                          element: 'img',
                          attributes: {
                            class: 'icon icon_project',
                            src: _assets_icons_open_in_new_svg__WEBPACK_IMPORTED_MODULE_1__,
                            onload: 'SVGInject(this)',
                          },
                        },
                      ],
                    },
                  ],
                },
                {
                  element: 'p',
                  attributes: {
                    textContent:
                      'Suspendisse commodo pharetra sem, euismod suscipit velit condimentum in. Integer rutrum malesuada orci, id euismod augue ultrices sed. Nulla eu enim ultricies, tincidunt lorem at, efficitur ex. Aenean tempus risus ac purus aliquet finibus.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
});


/***/ }),

/***/ "./src/components/projects/projects.js":
/*!*********************************************!*\
  !*** ./src/components/projects/projects.js ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _helpers_createElement__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../helpers/createElement */ "./src/helpers/createElement.js");
/* harmony import */ var _projects_config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./projects.config */ "./src/components/projects/projects.config.js");
/* harmony import */ var _styles_projects_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../styles/projects.css */ "./src/styles/projects.css");




/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (() => {
  const projects = {
    init() {},
    cacheDOM() {},
    bindEvents() {},
    render() {
      const projectsSection = (0,_helpers_createElement__WEBPACK_IMPORTED_MODULE_0__["default"])(_projects_config__WEBPACK_IMPORTED_MODULE_1__["default"].element, _projects_config__WEBPACK_IMPORTED_MODULE_1__["default"].attributes);
      projectsSection.setChildren(_projects_config__WEBPACK_IMPORTED_MODULE_1__["default"].children);
      return projectsSection;
    },
  };

  return projects.render();
});


/***/ }),

/***/ "./src/components/socials/socials.config.js":
/*!**************************************************!*\
  !*** ./src/components/socials/socials.config.js ***!
  \**************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _assets_icons_github_mark_github_mark_white_svg__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../assets/icons/github_mark/github-mark-white.svg */ "./src/assets/icons/github_mark/github-mark-white.svg");
/* harmony import */ var _assets_icons_linkedin_mark_linkedin_00_svg__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../../assets/icons/linkedin_mark/linkedin_00.svg */ "./src/assets/icons/linkedin_mark/linkedin_00.svg");
/* harmony import */ var _assets_icons_x_mark_x_01_svg__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../assets/icons/x_mark/x_01.svg */ "./src/assets/icons/x_mark/x_01.svg");




/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  element: 'ul',
  attributes: {
    class: 'socials',
  },
  children: [
    {
      element: 'li',
      children: [
        {
          element: 'a',
          attributes: {
            href: '#',
          },
          children: [
            {
              element: 'img',
              attributes: {
                class: 'icon icon_social',
                src: _assets_icons_github_mark_github_mark_white_svg__WEBPACK_IMPORTED_MODULE_0__,
                onload: 'SVGInject(this)',
              },
            },
          ],
        },
      ],
    },
    {
      element: 'li',
      children: [
        {
          element: 'a',
          attributes: {
            href: '#',
          },
          children: [
            {
              element: 'img',
              attributes: {
                class: 'icon icon_social',
                src: _assets_icons_linkedin_mark_linkedin_00_svg__WEBPACK_IMPORTED_MODULE_1__,
                onload: 'SVGInject(this)',
              },
            },
          ],
        },
      ],
    },
    {
      element: 'li',
      children: [
        {
          element: 'a',
          attributes: {
            href: '#',
          },
          children: [
            {
              element: 'img',
              attributes: {
                class: 'icon icon_social',
                src: _assets_icons_x_mark_x_01_svg__WEBPACK_IMPORTED_MODULE_2__,
                onload: 'SVGInject(this)',
              },
            },
          ],
        },
      ],
    },
  ],
});


/***/ }),

/***/ "./src/components/socials/socials.js":
/*!*******************************************!*\
  !*** ./src/components/socials/socials.js ***!
  \*******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _helpers_createElement__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../../helpers/createElement */ "./src/helpers/createElement.js");
/* harmony import */ var _socials_config__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./socials.config */ "./src/components/socials/socials.config.js");
/* harmony import */ var _styles_socials_css__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../styles/socials.css */ "./src/styles/socials.css");




/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (() => {
  const socials = {
    init() {},
    cacheDOM(element) {},
    bindEvents() {},
    render() {
      const { element, attributes, children } = _socials_config__WEBPACK_IMPORTED_MODULE_1__["default"];
      const socials = (0,_helpers_createElement__WEBPACK_IMPORTED_MODULE_0__["default"])(element, attributes);
      socials.setChildren(children);
      return socials;
    },
  };

  return socials.render();
});


/***/ }),

/***/ "./src/helpers/createElement.js":
/*!**************************************!*\
  !*** ./src/helpers/createElement.js ***!
  \**************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ createElement)
/* harmony export */ });
const BuildElement = (state) => ({
  setAttributes: (attributes) => {
    Object.entries(attributes).forEach(([key, value]) => {
      if (key !== 'textContent') {
        if (key === 'class') {
          state.setClassName(value.split(/\s/));
        } else if (key === 'style') {
          state.setStyle(value);
        } else {
          state.setAttribute(key, value);
        }
      } else {
        state.setTextContent(value);
      }
    });
  },
  setStyle: (text) => {
    state.style.cssText = text;
  },
  setID: (id) => {
    state.id = id;
  },
  setClassName: (arrClass) => {
    arrClass.forEach((className) => state.classList.add(className));
  },
  setTextContent: (text) => {
    state.textContent = text;
  },
  setChildren: (children) => {
    children.forEach((child) => {
      if (child instanceof HTMLElement) {
        state.appendChild(child);
      } else {
        const childElement = createElement(child.element);
        if (child.attributes && child.attributes.constructor.name === 'Object') {
          childElement.setAttributes(child.attributes);
        }
        if (child.children) {
          childElement.setChildren(child.children);
        }
        state.appendChild(childElement);
      }
    });
  },
});

function createElement(tagName, attributes) {
  const htmlElement = document.createElement(tagName);
  Object.assign(htmlElement, BuildElement(htmlElement));
  if (attributes) htmlElement.setAttributes(attributes);
  return htmlElement;
}


/***/ }),

/***/ "./src/helpers/pubSub.js":
/*!*******************************!*\
  !*** ./src/helpers/pubSub.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  subscribers: {},
  subscribe(subscriber, fn) {
    this.subscribers[subscriber] = this.subscribers[subscriber] || [];
    if (!this.subscribers[subscriber].some((handler) => handler.name === fn.name)) {
      this.subscribers[subscriber].push(fn);
    }
  },
  unsubscribe(subscriber, fn) {
    if (this.subscribers[subscriber]) {
      this.subscribers[subscriber].splice(this.subscribers[subscriber].indexOf(fn), 1);
      if (this.subscribers[subscriber].length === 0) delete this.subscribers[subscriber];
    }
  },
  publish(subscriber, ...args) {
    if (this.subscribers[subscriber]) {
      this.subscribers[subscriber].forEach((fn) => fn(...args));
    }
  },
});


/***/ }),

/***/ "./src/assets/fonts/Roboto_Condensed/static/RobotoCondensed-Medium.ttf":
/*!*****************************************************************************!*\
  !*** ./src/assets/fonts/Roboto_Condensed/static/RobotoCondensed-Medium.ttf ***!
  \*****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "ff190f979bb05ae7bee6.ttf";

/***/ }),

/***/ "./src/assets/icons/email.svg":
/*!************************************!*\
  !*** ./src/assets/icons/email.svg ***!
  \************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "bff3aa9bbc9d4dbea770.svg";

/***/ }),

/***/ "./src/assets/icons/github_mark/github-mark-white.svg":
/*!************************************************************!*\
  !*** ./src/assets/icons/github_mark/github-mark-white.svg ***!
  \************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "3b5bbb15a4baead82746.svg";

/***/ }),

/***/ "./src/assets/icons/linkedin_mark/linkedin_00.svg":
/*!********************************************************!*\
  !*** ./src/assets/icons/linkedin_mark/linkedin_00.svg ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "d1a85161e41132762816.svg";

/***/ }),

/***/ "./src/assets/icons/open_in_new.svg":
/*!******************************************!*\
  !*** ./src/assets/icons/open_in_new.svg ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "34c33779f7461c4ba337.svg";

/***/ }),

/***/ "./src/assets/icons/phone_classic.svg":
/*!********************************************!*\
  !*** ./src/assets/icons/phone_classic.svg ***!
  \********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "01bdf46607af7d5f8332.svg";

/***/ }),

/***/ "./src/assets/icons/placeholder/undraw_male_avatar_g98d.svg":
/*!******************************************************************!*\
  !*** ./src/assets/icons/placeholder/undraw_male_avatar_g98d.svg ***!
  \******************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "72ef06155729d435c476.svg";

/***/ }),

/***/ "./src/assets/icons/placeholder/undraw_personal_text_re_vqj3.svg":
/*!***********************************************************************!*\
  !*** ./src/assets/icons/placeholder/undraw_personal_text_re_vqj3.svg ***!
  \***********************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "5afba85556efd4cf6ec3.svg";

/***/ }),

/***/ "./src/assets/icons/x_mark/x_01.svg":
/*!******************************************!*\
  !*** ./src/assets/icons/x_mark/x_01.svg ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "9bf5b292c7905d0398b1.svg";

/***/ }),

/***/ "./src/assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_1920_1280.jpg":
/*!****************************************************************************!*\
  !*** ./src/assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_1920_1280.jpg ***!
  \****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "6d89ada5ec019df38d29.jpg";

/***/ }),

/***/ "./src/assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_2400_1600.jpg":
/*!****************************************************************************!*\
  !*** ./src/assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_2400_1600.jpg ***!
  \****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "957acde975a8ba7d0abd.jpg";

/***/ }),

/***/ "./src/assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_4951_3301.jpg":
/*!****************************************************************************!*\
  !*** ./src/assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_4951_3301.jpg ***!
  \****************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "d533429e860b40c87d0f.jpg";

/***/ }),

/***/ "./src/assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_640_427.jpg":
/*!**************************************************************************!*\
  !*** ./src/assets/images/matthew-henry-U5rMrSI7Pn4-unsplash_640_427.jpg ***!
  \**************************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

"use strict";
module.exports = __webpack_require__.p + "fbae8a93275aa38e272d.jpg";

/***/ })

},
/******/ __webpack_require__ => { // webpackRuntimeModules
/******/ var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
/******/ var __webpack_exports__ = (__webpack_exec__("./src/app.js"));
/******/ }
]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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LE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSx5REFBeUQsbUJBQW1CO0FBQzVFOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVBQWUsa0JBQWtCO0FBQ2pDLGVBQWUsUUFBUTtBQUN2QjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsWUFBWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUEsNEJBQTRCLGlCQUFpQjtBQUM3QztBQUNBO0FBQ0E7QUFDQSxVQUFVO0FBQ1Y7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2I7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVB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ZjtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7Ozs7O0FDbkRBLGlFQUFlO0FBQ2YsaUJBQWlCO0FBQ2pCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSCxDQUFDLEVBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vbm9kZV9tb2R1bGVzL0BpY29uZnUvc3ZnLWluamVjdC9kaXN0L3N2Zy1pbmplY3QuanMiLCJ3ZWJwYWNrOi8vbW9kdWxlLXdlYnBhY2stc3RhcnRlci8uL3NyYy9hcHAuY3NzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9zcmMvc3R5bGVzL2Fib3V0LmNzcyIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vc3JjL3N0eWxlcy9idG5fbWVudS5jc3MiLCJ3ZWJwYWNrOi8vbW9kdWxlLXdlYnBhY2stc3RhcnRlci8uL3NyYy9zdHlsZXMvY29udGFjdC5jc3MiLCJ3ZWJwYWNrOi8vbW9kdWxlLXdlYnBhY2stc3RhcnRlci8uL3NyYy9zdHlsZXMvZm9vdGVyLmNzcyIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vc3JjL3N0eWxlcy9oZWFkZXIuY3NzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9zcmMvc3R5bGVzL21haW4uY3NzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9zcmMvc3R5bGVzL25hdmJhci5jc3MiLCJ3ZWJwYWNrOi8vbW9kdWxlLXdlYnBhY2stc3RhcnRlci8uL3NyYy9zdHlsZXMvcHJvamVjdHMuY3NzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9zcmMvc3R5bGVzL3NvY2lhbHMuY3NzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvZ2V0VXJsLmpzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvc291cmNlTWFwcy5qcyIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vc3JjL2FwcC5jc3M/YTY3MiIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vc3JjL3N0eWxlcy9hYm91dC5jc3M/ZDExNyIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vc3JjL3N0eWxlcy9idG5fbWVudS5jc3M/OTYzOSIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vc3JjL3N0eWxlcy9jb250YWN0LmNzcz8yOTYyIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9zcmMvc3R5bGVzL2Zvb3Rlci5jc3M/N2U5MiIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vc3JjL3N0eWxlcy9oZWFkZXIuY3NzP2U2OGIiLCJ3ZWJwYWNrOi8vbW9kdWxlLXdlYnBhY2stc3RhcnRlci8uL3NyYy9zdHlsZXMvbWFpbi5jc3M/ZTgwYSIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vc3JjL3N0eWxlcy9uYXZiYXIuY3NzP2MxZGIiLCJ3ZWJwYWNrOi8vbW9kdWxlLXdlYnBhY2stc3RhcnRlci8uL3NyYy9zdHlsZXMvcHJvamVjdHMuY3NzPzFhYWEiLCJ3ZWJwYWNrOi8vbW9kdWxlLXdlYnBhY2stc3RhcnRlci8uL3NyYy9zdHlsZXMvc29jaWFscy5jc3M/MDljNSIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5qZWN0U3R5bGVzSW50b1N0eWxlVGFnLmpzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbnNlcnRCeVNlbGVjdG9yLmpzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbnNlcnRTdHlsZUVsZW1lbnQuanMiLCJ3ZWJwYWNrOi8vbW9kdWxlLXdlYnBhY2stc3RhcnRlci8uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL3NldEF0dHJpYnV0ZXNXaXRob3V0QXR0cmlidXRlcy5qcyIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvc3R5bGVEb21BUEkuanMiLCJ3ZWJwYWNrOi8vbW9kdWxlLXdlYnBhY2stc3RhcnRlci8uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL3N0eWxlVGFnVHJhbnNmb3JtLmpzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9zcmMvYXBwLmpzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9zcmMvY29tcG9uZW50cy9hYm91dC9hYm91dC5jb25maWcuanMiLCJ3ZWJwYWNrOi8vbW9kdWxlLXdlYnBhY2stc3RhcnRlci8uL3NyYy9jb21wb25lbnRzL2Fib3V0L2Fib3V0LmpzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9zcmMvY29tcG9uZW50cy9idXR0b25zL21lbnUvYnRuX21lbnUuY29uZmlnLmpzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9zcmMvY29tcG9uZW50cy9idXR0b25zL21lbnUvYnRuX21lbnUuanMiLCJ3ZWJwYWNrOi8vbW9kdWxlLXdlYnBhY2stc3RhcnRlci8uL3NyYy9jb21wb25lbnRzL2NvbnRhY3QvY29udGFjdC5jb25maWcuanMiLCJ3ZWJwYWNrOi8vbW9kdWxlLXdlYnBhY2stc3RhcnRlci8uL3NyYy9jb21wb25lbnRzL2NvbnRhY3QvY29udGFjdC5qcyIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vc3JjL2NvbXBvbmVudHMvZm9vdGVyL2Zvb3Rlci5qcyIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vc3JjL2NvbXBvbmVudHMvaGVhZGVyL2hlYWRlci5qcyIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vc3JjL2NvbXBvbmVudHMvbWFpbi9tYWluLmpzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9zcmMvY29tcG9uZW50cy9uYXZiYXIvbmF2YmFyLmNvbmZpZy5qcyIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vc3JjL2NvbXBvbmVudHMvbmF2YmFyL25hdmJhci5qcyIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vc3JjL2NvbXBvbmVudHMvcHJvamVjdHMvcHJvamVjdHMuY29uZmlnLmpzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9zcmMvY29tcG9uZW50cy9wcm9qZWN0cy9wcm9qZWN0cy5qcyIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vc3JjL2NvbXBvbmVudHMvc29jaWFscy9zb2NpYWxzLmNvbmZpZy5qcyIsIndlYnBhY2s6Ly9tb2R1bGUtd2VicGFjay1zdGFydGVyLy4vc3JjL2NvbXBvbmVudHMvc29jaWFscy9zb2NpYWxzLmpzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9zcmMvaGVscGVycy9jcmVhdGVFbGVtZW50LmpzIiwid2VicGFjazovL21vZHVsZS13ZWJwYWNrLXN0YXJ0ZXIvLi9zcmMvaGVscGVycy9wdWJTdWIuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBTVkdJbmplY3QgLSBWZXJzaW9uIDEuMi4zXG4gKiBBIHRpbnksIGludHVpdGl2ZSwgcm9idXN0LCBjYWNoaW5nIHNvbHV0aW9uIGZvciBpbmplY3RpbmcgU1ZHIGZpbGVzIGlubGluZSBpbnRvIHRoZSBET00uXG4gKlxuICogaHR0cHM6Ly9naXRodWIuY29tL2ljb25mdS9zdmctaW5qZWN0XG4gKlxuICogQ29weXJpZ2h0IChjKSAyMDE4IElOQ09SUywgdGhlIGNyZWF0b3JzIG9mIGljb25mdS5jb21cbiAqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIC0gaHR0cHM6Ly9naXRodWIuY29tL2ljb25mdS9zdmctaW5qZWN0L2Jsb2IvbWFzdGVyL0xJQ0VOU0VcbiAqL1xuXG4oZnVuY3Rpb24od2luZG93LCBkb2N1bWVudCkge1xuICAvLyBjb25zdGFudHMgZm9yIGJldHRlciBtaW5pZmljYXRpb25cbiAgdmFyIF9DUkVBVEVfRUxFTUVOVF8gPSAnY3JlYXRlRWxlbWVudCc7XG4gIHZhciBfR0VUX0VMRU1FTlRTX0JZX1RBR19OQU1FXyA9ICdnZXRFbGVtZW50c0J5VGFnTmFtZSc7XG4gIHZhciBfTEVOR1RIXyA9ICdsZW5ndGgnO1xuICB2YXIgX1NUWUxFXyA9ICdzdHlsZSc7XG4gIHZhciBfVElUTEVfID0gJ3RpdGxlJztcbiAgdmFyIF9VTkRFRklORURfID0gJ3VuZGVmaW5lZCc7XG4gIHZhciBfU0VUX0FUVFJJQlVURV8gPSAnc2V0QXR0cmlidXRlJztcbiAgdmFyIF9HRVRfQVRUUklCVVRFXyA9ICdnZXRBdHRyaWJ1dGUnO1xuXG4gIHZhciBOVUxMID0gbnVsbDtcblxuICAvLyBjb25zdGFudHNcbiAgdmFyIF9fU1ZHSU5KRUNUID0gJ19fc3ZnSW5qZWN0JztcbiAgdmFyIElEX1NVRkZJWCA9ICctLWluamVjdC0nO1xuICB2YXIgSURfU1VGRklYX1JFR0VYID0gbmV3IFJlZ0V4cChJRF9TVUZGSVggKyAnXFxcXGQrJywgXCJnXCIpO1xuICB2YXIgTE9BRF9GQUlMID0gJ0xPQURfRkFJTCc7XG4gIHZhciBTVkdfTk9UX1NVUFBPUlRFRCA9ICdTVkdfTk9UX1NVUFBPUlRFRCc7XG4gIHZhciBTVkdfSU5WQUxJRCA9ICdTVkdfSU5WQUxJRCc7XG4gIHZhciBBVFRSSUJVVEVfRVhDTFVTSU9OX05BTUVTID0gWydzcmMnLCAnYWx0JywgJ29ubG9hZCcsICdvbmVycm9yJ107XG4gIHZhciBBX0VMRU1FTlQgPSBkb2N1bWVudFtfQ1JFQVRFX0VMRU1FTlRfXSgnYScpO1xuICB2YXIgSVNfU1ZHX1NVUFBPUlRFRCA9IHR5cGVvZiBTVkdSZWN0ICE9IF9VTkRFRklORURfO1xuICB2YXIgREVGQVVMVF9PUFRJT05TID0ge1xuICAgIHVzZUNhY2hlOiB0cnVlLFxuICAgIGNvcHlBdHRyaWJ1dGVzOiB0cnVlLFxuICAgIG1ha2VJZHNVbmlxdWU6IHRydWVcbiAgfTtcbiAgLy8gTWFwIG9mIElSSSByZWZlcmVuY2VhYmxlIHRhZyBuYW1lcyB0byBwcm9wZXJ0aWVzIHRoYXQgY2FuIHJlZmVyZW5jZSB0aGVtLiBUaGlzIGlzIGRlZmluZWQgaW5cbiAgLy8gaHR0cHM6Ly93d3cudzMub3JnL1RSL1NWRzExL2xpbmtpbmcuaHRtbCNwcm9jZXNzaW5nSVJJXG4gIHZhciBJUklfVEFHX1BST1BFUlRJRVNfTUFQID0ge1xuICAgIGNsaXBQYXRoOiBbJ2NsaXAtcGF0aCddLFxuICAgICdjb2xvci1wcm9maWxlJzogTlVMTCxcbiAgICBjdXJzb3I6IE5VTEwsXG4gICAgZmlsdGVyOiBOVUxMLFxuICAgIGxpbmVhckdyYWRpZW50OiBbJ2ZpbGwnLCAnc3Ryb2tlJ10sXG4gICAgbWFya2VyOiBbJ21hcmtlcicsICdtYXJrZXItZW5kJywgJ21hcmtlci1taWQnLCAnbWFya2VyLXN0YXJ0J10sXG4gICAgbWFzazogTlVMTCxcbiAgICBwYXR0ZXJuOiBbJ2ZpbGwnLCAnc3Ryb2tlJ10sXG4gICAgcmFkaWFsR3JhZGllbnQ6IFsnZmlsbCcsICdzdHJva2UnXVxuICB9O1xuICB2YXIgSU5KRUNURUQgPSAxO1xuICB2YXIgRkFJTCA9IDI7XG5cbiAgdmFyIHVuaXF1ZUlkQ291bnRlciA9IDE7XG4gIHZhciB4bWxTZXJpYWxpemVyO1xuICB2YXIgZG9tUGFyc2VyO1xuXG5cbiAgLy8gY3JlYXRlcyBhbiBTVkcgZG9jdW1lbnQgZnJvbSBhbiBTVkcgc3RyaW5nXG4gIGZ1bmN0aW9uIHN2Z1N0cmluZ1RvU3ZnRG9jKHN2Z1N0cikge1xuICAgIGRvbVBhcnNlciA9IGRvbVBhcnNlciB8fCBuZXcgRE9NUGFyc2VyKCk7XG4gICAgcmV0dXJuIGRvbVBhcnNlci5wYXJzZUZyb21TdHJpbmcoc3ZnU3RyLCAndGV4dC94bWwnKTtcbiAgfVxuXG5cbiAgLy8gc2VhcmlhbGl6ZXMgYW4gU1ZHIGVsZW1lbnQgdG8gYW4gU1ZHIHN0cmluZ1xuICBmdW5jdGlvbiBzdmdFbGVtVG9TdmdTdHJpbmcoc3ZnRWxlbWVudCkge1xuICAgIHhtbFNlcmlhbGl6ZXIgPSB4bWxTZXJpYWxpemVyIHx8IG5ldyBYTUxTZXJpYWxpemVyKCk7XG4gICAgcmV0dXJuIHhtbFNlcmlhbGl6ZXIuc2VyaWFsaXplVG9TdHJpbmcoc3ZnRWxlbWVudCk7XG4gIH1cblxuXG4gIC8vIFJldHVybnMgdGhlIGFic29sdXRlIHVybCBmb3IgdGhlIHNwZWNpZmllZCB1cmxcbiAgZnVuY3Rpb24gZ2V0QWJzb2x1dGVVcmwodXJsKSB7XG4gICAgQV9FTEVNRU5ULmhyZWYgPSB1cmw7XG4gICAgcmV0dXJuIEFfRUxFTUVOVC5ocmVmO1xuICB9XG5cblxuICAvLyBMb2FkIHN2ZyB3aXRoIGFuIFhIUiByZXF1ZXN0XG4gIGZ1bmN0aW9uIGxvYWRTdmcodXJsLCBjYWxsYmFjaywgZXJyb3JDYWxsYmFjaykge1xuICAgIGlmICh1cmwpIHtcbiAgICAgIHZhciByZXEgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgIHJlcS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHJlcS5yZWFkeVN0YXRlID09IDQpIHtcbiAgICAgICAgICAvLyByZWFkeVN0YXRlIGlzIERPTkVcbiAgICAgICAgICB2YXIgc3RhdHVzID0gcmVxLnN0YXR1cztcbiAgICAgICAgICBpZiAoc3RhdHVzID09IDIwMCkge1xuICAgICAgICAgICAgLy8gcmVxdWVzdCBzdGF0dXMgaXMgT0tcbiAgICAgICAgICAgIGNhbGxiYWNrKHJlcS5yZXNwb25zZVhNTCwgcmVxLnJlc3BvbnNlVGV4dC50cmltKCkpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc3RhdHVzID49IDQwMCkge1xuICAgICAgICAgICAgLy8gcmVxdWVzdCBzdGF0dXMgaXMgZXJyb3IgKDR4eCBvciA1eHgpXG4gICAgICAgICAgICBlcnJvckNhbGxiYWNrKCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChzdGF0dXMgPT0gMCkge1xuICAgICAgICAgICAgLy8gcmVxdWVzdCBzdGF0dXMgMCBjYW4gaW5kaWNhdGUgYSBmYWlsZWQgY3Jvc3MtZG9tYWluIGNhbGxcbiAgICAgICAgICAgIGVycm9yQ2FsbGJhY2soKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICByZXEub3BlbignR0VUJywgdXJsLCB0cnVlKTtcbiAgICAgIHJlcS5zZW5kKCk7XG4gICAgfVxuICB9XG5cblxuICAvLyBDb3B5IGF0dHJpYnV0ZXMgZnJvbSBpbWcgZWxlbWVudCB0byBzdmcgZWxlbWVudFxuICBmdW5jdGlvbiBjb3B5QXR0cmlidXRlcyhpbWdFbGVtLCBzdmdFbGVtKSB7XG4gICAgdmFyIGF0dHJpYnV0ZTtcbiAgICB2YXIgYXR0cmlidXRlTmFtZTtcbiAgICB2YXIgYXR0cmlidXRlVmFsdWU7XG4gICAgdmFyIGF0dHJpYnV0ZXMgPSBpbWdFbGVtLmF0dHJpYnV0ZXM7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdHRyaWJ1dGVzW19MRU5HVEhfXTsgaSsrKSB7XG4gICAgICBhdHRyaWJ1dGUgPSBhdHRyaWJ1dGVzW2ldO1xuICAgICAgYXR0cmlidXRlTmFtZSA9IGF0dHJpYnV0ZS5uYW1lO1xuICAgICAgLy8gT25seSBjb3B5IGF0dHJpYnV0ZXMgbm90IGV4cGxpY2l0bHkgZXhjbHVkZWQgZnJvbSBjb3B5aW5nXG4gICAgICBpZiAoQVRUUklCVVRFX0VYQ0xVU0lPTl9OQU1FUy5pbmRleE9mKGF0dHJpYnV0ZU5hbWUpID09IC0xKSB7XG4gICAgICAgIGF0dHJpYnV0ZVZhbHVlID0gYXR0cmlidXRlLnZhbHVlO1xuICAgICAgICAvLyBJZiBpbWcgYXR0cmlidXRlIGlzIFwidGl0bGVcIiwgaW5zZXJ0IGEgdGl0bGUgZWxlbWVudCBpbnRvIFNWRyBlbGVtZW50XG4gICAgICAgIGlmIChhdHRyaWJ1dGVOYW1lID09IF9USVRMRV8pIHtcbiAgICAgICAgICB2YXIgdGl0bGVFbGVtO1xuICAgICAgICAgIHZhciBmaXJzdEVsZW1lbnRDaGlsZCA9IHN2Z0VsZW0uZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgaWYgKGZpcnN0RWxlbWVudENoaWxkICYmIGZpcnN0RWxlbWVudENoaWxkLmxvY2FsTmFtZS50b0xvd2VyQ2FzZSgpID09IF9USVRMRV8pIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSBTVkcgZWxlbWVudCdzIGZpcnN0IGNoaWxkIGlzIGEgdGl0bGUgZWxlbWVudCwga2VlcCBpdCBhcyB0aGUgdGl0bGUgZWxlbWVudFxuICAgICAgICAgICAgdGl0bGVFbGVtID0gZmlyc3RFbGVtZW50Q2hpbGQ7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIElmIHRoZSBTVkcgZWxlbWVudCdzIGZpcnN0IGNoaWxkIGVsZW1lbnQgaXMgbm90IGEgdGl0bGUgZWxlbWVudCwgY3JlYXRlIGEgbmV3IHRpdGxlXG4gICAgICAgICAgICAvLyBlbGUsZW10IGFuZCBzZXQgaXQgYXMgdGhlIGZpcnN0IGNoaWxkXG4gICAgICAgICAgICB0aXRsZUVsZW0gPSBkb2N1bWVudFtfQ1JFQVRFX0VMRU1FTlRfICsgJ05TJ10oJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJywgX1RJVExFXyk7XG4gICAgICAgICAgICBzdmdFbGVtLmluc2VydEJlZm9yZSh0aXRsZUVsZW0sIGZpcnN0RWxlbWVudENoaWxkKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gU2V0IG5ldyB0aXRsZSBjb250ZW50XG4gICAgICAgICAgdGl0bGVFbGVtLnRleHRDb250ZW50ID0gYXR0cmlidXRlVmFsdWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gU2V0IGltZyBhdHRyaWJ1dGUgdG8gc3ZnIGVsZW1lbnRcbiAgICAgICAgICBzdmdFbGVtW19TRVRfQVRUUklCVVRFX10oYXR0cmlidXRlTmFtZSwgYXR0cmlidXRlVmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cblxuICAvLyBUaGlzIGZ1bmN0aW9uIGFwcGVuZHMgYSBzdWZmaXggdG8gSURzIG9mIHJlZmVyZW5jZWQgZWxlbWVudHMgaW4gdGhlIDxkZWZzPiBpbiBvcmRlciB0byAgdG8gYXZvaWQgSUQgY29sbGlzaW9uXG4gIC8vIGJldHdlZW4gbXVsdGlwbGUgaW5qZWN0ZWQgU1ZHcy4gVGhlIHN1ZmZpeCBoYXMgdGhlIGZvcm0gXCItLWluamVjdC1YXCIsIHdoZXJlIFggaXMgYSBydW5uaW5nIG51bWJlciB3aGljaCBpc1xuICAvLyBpbmNyZW1lbnRlZCB3aXRoIGVhY2ggaW5qZWN0aW9uLiBSZWZlcmVuY2VzIHRvIHRoZSBJRHMgYXJlIGFkanVzdGVkIGFjY29yZGluZ2x5LlxuICAvLyBXZSBhc3N1bWUgdGhhIGFsbCBJRHMgd2l0aGluIHRoZSBpbmplY3RlZCBTVkcgYXJlIHVuaXF1ZSwgdGhlcmVmb3JlIHRoZSBzYW1lIHN1ZmZpeCBjYW4gYmUgdXNlZCBmb3IgYWxsIElEcyBvZiBvbmVcbiAgLy8gaW5qZWN0ZWQgU1ZHLlxuICAvLyBJZiB0aGUgb25seVJlZmVyZW5jZWQgYXJndW1lbnQgaXMgc2V0IHRvIHRydWUsIG9ubHkgdGhvc2UgSURzIHdpbGwgYmUgbWFkZSB1bmlxdWUgdGhhdCBhcmUgcmVmZXJlbmNlZCBmcm9tIHdpdGhpbiB0aGUgU1ZHXG4gIGZ1bmN0aW9uIG1ha2VJZHNVbmlxdWUoc3ZnRWxlbSwgb25seVJlZmVyZW5jZWQpIHtcbiAgICB2YXIgaWRTdWZmaXggPSBJRF9TVUZGSVggKyB1bmlxdWVJZENvdW50ZXIrKztcbiAgICAvLyBSZWd1bGFyIGV4cHJlc3Npb24gZm9yIGZ1bmN0aW9uYWwgbm90YXRpb25zIG9mIGFuIElSSSByZWZlcmVuY2VzLiBUaGlzIHdpbGwgZmluZCBvY2N1cmVuY2VzIGluIHRoZSBmb3JtXG4gICAgLy8gdXJsKCNhbnlJZCkgb3IgdXJsKFwiI2FueUlkXCIpIChmb3IgSW50ZXJuZXQgRXhwbG9yZXIpIGFuZCBjYXB0dXJlIHRoZSByZWZlcmVuY2VkIElEXG4gICAgdmFyIGZ1bmNJcmlSZWdleCA9IC91cmxcXChcIj8jKFthLXpBLVpdW1xcdzouLV0qKVwiP1xcKS9nO1xuICAgIC8vIEdldCBhbGwgZWxlbWVudHMgd2l0aCBhbiBJRC4gVGhlIFNWRyBzcGVjIHJlY29tbWVuZHMgdG8gcHV0IHJlZmVyZW5jZWQgZWxlbWVudHMgaW5zaWRlIDxkZWZzPiBlbGVtZW50cywgYnV0XG4gICAgLy8gdGhpcyBpcyBub3QgYSByZXF1aXJlbWVudCwgdGhlcmVmb3JlIHdlIGhhdmUgdG8gc2VhcmNoIGZvciBJRHMgaW4gdGhlIHdob2xlIFNWRy5cbiAgICB2YXIgaWRFbGVtZW50cyA9IHN2Z0VsZW0ucXVlcnlTZWxlY3RvckFsbCgnW2lkXScpO1xuICAgIHZhciBpZEVsZW07XG4gICAgLy8gQW4gb2JqZWN0IGNvbnRhaW5pbmcgcmVmZXJlbmNlZCBJRHMgIGFzIGtleXMgaXMgdXNlZCBpZiBvbmx5IHJlZmVyZW5jZWQgSURzIHNob3VsZCBiZSB1bmlxdWlmaWVkLlxuICAgIC8vIElmIHRoaXMgb2JqZWN0IGRvZXMgbm90IGV4aXN0LCBhbGwgSURzIHdpbGwgYmUgdW5pcXVpZmllZC5cbiAgICB2YXIgcmVmZXJlbmNlZElkcyA9IG9ubHlSZWZlcmVuY2VkID8gW10gOiBOVUxMO1xuICAgIHZhciB0YWdOYW1lO1xuICAgIHZhciBpcmlUYWdOYW1lcyA9IHt9O1xuICAgIHZhciBpcmlQcm9wZXJ0aWVzID0gW107XG4gICAgdmFyIGNoYW5nZWQgPSBmYWxzZTtcbiAgICB2YXIgaSwgajtcblxuICAgIGlmIChpZEVsZW1lbnRzW19MRU5HVEhfXSkge1xuICAgICAgLy8gTWFrZSBhbGwgSURzIHVuaXF1ZSBieSBhZGRpbmcgdGhlIElEIHN1ZmZpeCBhbmQgY29sbGVjdCBhbGwgZW5jb3VudGVyZWQgdGFnIG5hbWVzXG4gICAgICAvLyB0aGF0IGFyZSBJUkkgcmVmZXJlbmNlYWJsZSBmcm9tIHByb3Blcml0aWVzLlxuICAgICAgZm9yIChpID0gMDsgaSA8IGlkRWxlbWVudHNbX0xFTkdUSF9dOyBpKyspIHtcbiAgICAgICAgdGFnTmFtZSA9IGlkRWxlbWVudHNbaV0ubG9jYWxOYW1lOyAvLyBVc2Ugbm9uLW5hbWVzcGFjZWQgdGFnIG5hbWVcbiAgICAgICAgLy8gTWFrZSBJRCB1bmlxdWUgaWYgdGFnIG5hbWUgaXMgSVJJIHJlZmVyZW5jZWFibGVcbiAgICAgICAgaWYgKHRhZ05hbWUgaW4gSVJJX1RBR19QUk9QRVJUSUVTX01BUCkge1xuICAgICAgICAgIGlyaVRhZ05hbWVzW3RhZ05hbWVdID0gMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gR2V0IGFsbCBwcm9wZXJ0aWVzIHRoYXQgYXJlIG1hcHBlZCB0byB0aGUgZm91bmQgSVJJIHJlZmVyZW5jZWFibGUgdGFnc1xuICAgICAgZm9yICh0YWdOYW1lIGluIGlyaVRhZ05hbWVzKSB7XG4gICAgICAgIChJUklfVEFHX1BST1BFUlRJRVNfTUFQW3RhZ05hbWVdIHx8IFt0YWdOYW1lXSkuZm9yRWFjaChmdW5jdGlvbiAobWFwcGVkUHJvcGVydHkpIHtcbiAgICAgICAgICAvLyBBZGQgbWFwcGVkIHByb3BlcnRpZXMgdG8gYXJyYXkgb2YgaXJpIHJlZmVyZW5jaW5nIHByb3BlcnRpZXMuXG4gICAgICAgICAgLy8gVXNlIGxpbmVhciBzZWFyY2ggaGVyZSBiZWNhdXNlIHRoZSBudW1iZXIgb2YgcG9zc2libGUgZW50cmllcyBpcyB2ZXJ5IHNtYWxsIChtYXhpbXVtIDExKVxuICAgICAgICAgIGlmIChpcmlQcm9wZXJ0aWVzLmluZGV4T2YobWFwcGVkUHJvcGVydHkpIDwgMCkge1xuICAgICAgICAgICAgaXJpUHJvcGVydGllcy5wdXNoKG1hcHBlZFByb3BlcnR5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgaWYgKGlyaVByb3BlcnRpZXNbX0xFTkdUSF9dKSB7XG4gICAgICAgIC8vIEFkZCBcInN0eWxlXCIgdG8gcHJvcGVydGllcywgYmVjYXVzZSBpdCBtYXkgY29udGFpbiByZWZlcmVuY2VzIGluIHRoZSBmb3JtICdzdHlsZT1cImZpbGw6dXJsKCNteUZpbGwpXCInXG4gICAgICAgIGlyaVByb3BlcnRpZXMucHVzaChfU1RZTEVfKTtcbiAgICAgIH1cbiAgICAgIC8vIFJ1biB0aHJvdWdoIGFsbCBlbGVtZW50cyBvZiB0aGUgU1ZHIGFuZCByZXBsYWNlIElEcyBpbiByZWZlcmVuY2VzLlxuICAgICAgLy8gVG8gZ2V0IGFsbCBkZXNjZW5kaW5nIGVsZW1lbnRzLCBnZXRFbGVtZW50c0J5VGFnTmFtZSgnKicpIHNlZW1zIHRvIHBlcmZvcm0gZmFzdGVyIHRoYW4gcXVlcnlTZWxlY3RvckFsbCgnKicpLlxuICAgICAgLy8gU2luY2Ugc3ZnRWxlbS5nZXRFbGVtZW50c0J5VGFnTmFtZSgnKicpIGRvZXMgbm90IHJldHVybiB0aGUgc3ZnIGVsZW1lbnQgaXRzZWxmLCB3ZSBoYXZlIHRvIGhhbmRsZSBpdCBzZXBhcmF0ZWx5LlxuICAgICAgdmFyIGRlc2NFbGVtZW50cyA9IHN2Z0VsZW1bX0dFVF9FTEVNRU5UU19CWV9UQUdfTkFNRV9dKCcqJyk7XG4gICAgICB2YXIgZWxlbWVudCA9IHN2Z0VsZW07XG4gICAgICB2YXIgcHJvcGVydHlOYW1lO1xuICAgICAgdmFyIHZhbHVlO1xuICAgICAgdmFyIG5ld1ZhbHVlO1xuICAgICAgZm9yIChpID0gLTE7IGVsZW1lbnQgIT0gTlVMTDspIHtcbiAgICAgICAgaWYgKGVsZW1lbnQubG9jYWxOYW1lID09IF9TVFlMRV8pIHtcbiAgICAgICAgICAvLyBJZiBlbGVtZW50IGlzIGEgc3R5bGUgZWxlbWVudCwgcmVwbGFjZSBJRHMgaW4gYWxsIG9jY3VyZW5jZXMgb2YgXCJ1cmwoI2FueUlkKVwiIGluIHRleHQgY29udGVudFxuICAgICAgICAgIHZhbHVlID0gZWxlbWVudC50ZXh0Q29udGVudDtcbiAgICAgICAgICBuZXdWYWx1ZSA9IHZhbHVlICYmIHZhbHVlLnJlcGxhY2UoZnVuY0lyaVJlZ2V4LCBmdW5jdGlvbihtYXRjaCwgaWQpIHtcbiAgICAgICAgICAgIGlmIChyZWZlcmVuY2VkSWRzKSB7XG4gICAgICAgICAgICAgIHJlZmVyZW5jZWRJZHNbaWRdID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAndXJsKCMnICsgaWQgKyBpZFN1ZmZpeCArICcpJztcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAobmV3VmFsdWUgIT09IHZhbHVlKSB7XG4gICAgICAgICAgICBlbGVtZW50LnRleHRDb250ZW50ID0gbmV3VmFsdWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKGVsZW1lbnQuaGFzQXR0cmlidXRlcygpKSB7XG4gICAgICAgICAgLy8gUnVuIHRocm91Z2ggYWxsIHByb3BlcnR5IG5hbWVzIGZvciB3aGljaCBJRHMgd2VyZSBmb3VuZFxuICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBpcmlQcm9wZXJ0aWVzW19MRU5HVEhfXTsgaisrKSB7XG4gICAgICAgICAgICBwcm9wZXJ0eU5hbWUgPSBpcmlQcm9wZXJ0aWVzW2pdO1xuICAgICAgICAgICAgdmFsdWUgPSBlbGVtZW50W19HRVRfQVRUUklCVVRFX10ocHJvcGVydHlOYW1lKTtcbiAgICAgICAgICAgIG5ld1ZhbHVlID0gdmFsdWUgJiYgdmFsdWUucmVwbGFjZShmdW5jSXJpUmVnZXgsIGZ1bmN0aW9uKG1hdGNoLCBpZCkge1xuICAgICAgICAgICAgICBpZiAocmVmZXJlbmNlZElkcykge1xuICAgICAgICAgICAgICAgIHJlZmVyZW5jZWRJZHNbaWRdID0gMTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAndXJsKCMnICsgaWQgKyBpZFN1ZmZpeCArICcpJztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKG5ld1ZhbHVlICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgICBlbGVtZW50W19TRVRfQVRUUklCVVRFX10ocHJvcGVydHlOYW1lLCBuZXdWYWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFJlcGxhY2UgSURzIGluIHhsaW5rOnJlZiBhbmQgaHJlZiBhdHRyaWJ1dGVzXG4gICAgICAgICAgWyd4bGluazpocmVmJywgJ2hyZWYnXS5mb3JFYWNoKGZ1bmN0aW9uKHJlZkF0dHJOYW1lKSB7XG4gICAgICAgICAgICB2YXIgaXJpID0gZWxlbWVudFtfR0VUX0FUVFJJQlVURV9dKHJlZkF0dHJOYW1lKTtcbiAgICAgICAgICAgIGlmICgvXlxccyojLy50ZXN0KGlyaSkpIHsgLy8gQ2hlY2sgaWYgaXJpIGlzIG5vbi1udWxsIGFuZCBpbnRlcm5hbCByZWZlcmVuY2VcbiAgICAgICAgICAgICAgaXJpID0gaXJpLnRyaW0oKTtcbiAgICAgICAgICAgICAgZWxlbWVudFtfU0VUX0FUVFJJQlVURV9dKHJlZkF0dHJOYW1lLCBpcmkgKyBpZFN1ZmZpeCk7XG4gICAgICAgICAgICAgIGlmIChyZWZlcmVuY2VkSWRzKSB7XG4gICAgICAgICAgICAgICAgLy8gQWRkIElEIHRvIHJlZmVyZW5jZWQgSURzXG4gICAgICAgICAgICAgICAgcmVmZXJlbmNlZElkc1tpcmkuc3Vic3RyaW5nKDEpXSA9IDE7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbGVtZW50ID0gZGVzY0VsZW1lbnRzWysraV07XG4gICAgICB9XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgaWRFbGVtZW50c1tfTEVOR1RIX107IGkrKykge1xuICAgICAgICBpZEVsZW0gPSBpZEVsZW1lbnRzW2ldO1xuICAgICAgICAvLyBJZiBzZXQgb2YgcmVmZXJlbmNlZCBJRHMgZXhpc3RzLCBtYWtlIG9ubHkgcmVmZXJlbmNlZCBJRHMgdW5pcXVlLFxuICAgICAgICAvLyBvdGhlcndpc2UgbWFrZSBhbGwgSURzIHVuaXF1ZS5cbiAgICAgICAgaWYgKCFyZWZlcmVuY2VkSWRzIHx8IHJlZmVyZW5jZWRJZHNbaWRFbGVtLmlkXSkge1xuICAgICAgICAgIC8vIEFkZCBzdWZmaXggdG8gZWxlbWVudCdzIElEXG4gICAgICAgICAgaWRFbGVtLmlkICs9IGlkU3VmZml4O1xuICAgICAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vIHJldHVybiB0cnVlIGlmIFNWRyBlbGVtZW50IGhhcyBjaGFuZ2VkXG4gICAgcmV0dXJuIGNoYW5nZWQ7XG4gIH1cblxuXG4gIC8vIEZvciBjYWNoZWQgU1ZHcyB0aGUgSURzIGFyZSBtYWRlIHVuaXF1ZSBieSBzaW1wbHkgcmVwbGFjaW5nIHRoZSBhbHJlYWR5IGluc2VydGVkIHVuaXF1ZSBJRHMgd2l0aCBhXG4gIC8vIGhpZ2hlciBJRCBjb3VudGVyLiBUaGlzIGlzIG11Y2ggbW9yZSBwZXJmb3JtYW50IHRoYW4gYSBjYWxsIHRvIG1ha2VJZHNVbmlxdWUoKS5cbiAgZnVuY3Rpb24gbWFrZUlkc1VuaXF1ZUNhY2hlZChzdmdTdHJpbmcpIHtcbiAgICByZXR1cm4gc3ZnU3RyaW5nLnJlcGxhY2UoSURfU1VGRklYX1JFR0VYLCBJRF9TVUZGSVggKyB1bmlxdWVJZENvdW50ZXIrKyk7XG4gIH1cblxuXG4gIC8vIEluamVjdCBTVkcgYnkgcmVwbGFjaW5nIHRoZSBpbWcgZWxlbWVudCB3aXRoIHRoZSBTVkcgZWxlbWVudCBpbiB0aGUgRE9NXG4gIGZ1bmN0aW9uIGluamVjdChpbWdFbGVtLCBzdmdFbGVtLCBhYnNVcmwsIG9wdGlvbnMpIHtcbiAgICBpZiAoc3ZnRWxlbSkge1xuICAgICAgc3ZnRWxlbVtfU0VUX0FUVFJJQlVURV9dKCdkYXRhLWluamVjdC11cmwnLCBhYnNVcmwpO1xuICAgICAgdmFyIHBhcmVudE5vZGUgPSBpbWdFbGVtLnBhcmVudE5vZGU7XG4gICAgICBpZiAocGFyZW50Tm9kZSkge1xuICAgICAgICBpZiAob3B0aW9ucy5jb3B5QXR0cmlidXRlcykge1xuICAgICAgICAgIGNvcHlBdHRyaWJ1dGVzKGltZ0VsZW0sIHN2Z0VsZW0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIEludm9rZSBiZWZvcmVJbmplY3QgaG9vayBpZiBzZXRcbiAgICAgICAgdmFyIGJlZm9yZUluamVjdCA9IG9wdGlvbnMuYmVmb3JlSW5qZWN0O1xuICAgICAgICB2YXIgaW5qZWN0RWxlbSA9IChiZWZvcmVJbmplY3QgJiYgYmVmb3JlSW5qZWN0KGltZ0VsZW0sIHN2Z0VsZW0pKSB8fCBzdmdFbGVtO1xuICAgICAgICAvLyBSZXBsYWNlIGltZyBlbGVtZW50IHdpdGggbmV3IGVsZW1lbnQuIFRoaXMgaXMgdGhlIGFjdHVhbCBpbmplY3Rpb24uXG4gICAgICAgIHBhcmVudE5vZGUucmVwbGFjZUNoaWxkKGluamVjdEVsZW0sIGltZ0VsZW0pO1xuICAgICAgICAvLyBNYXJrIGltZyBlbGVtZW50IGFzIGluamVjdGVkXG4gICAgICAgIGltZ0VsZW1bX19TVkdJTkpFQ1RdID0gSU5KRUNURUQ7XG4gICAgICAgIHJlbW92ZU9uTG9hZEF0dHJpYnV0ZShpbWdFbGVtKTtcbiAgICAgICAgLy8gSW52b2tlIGFmdGVySW5qZWN0IGhvb2sgaWYgc2V0XG4gICAgICAgIHZhciBhZnRlckluamVjdCA9IG9wdGlvbnMuYWZ0ZXJJbmplY3Q7XG4gICAgICAgIGlmIChhZnRlckluamVjdCkge1xuICAgICAgICAgIGFmdGVySW5qZWN0KGltZ0VsZW0sIGluamVjdEVsZW0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHN2Z0ludmFsaWQoaW1nRWxlbSwgb3B0aW9ucyk7XG4gICAgfVxuICB9XG5cblxuICAvLyBNZXJnZXMgYW55IG51bWJlciBvZiBvcHRpb25zIG9iamVjdHMgaW50byBhIG5ldyBvYmplY3RcbiAgZnVuY3Rpb24gbWVyZ2VPcHRpb25zKCkge1xuICAgIHZhciBtZXJnZWRPcHRpb25zID0ge307XG4gICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgLy8gSXRlcmF0ZSBvdmVyIGFsbCBzcGVjaWZpZWQgb3B0aW9ucyBvYmplY3RzIGFuZCBhZGQgYWxsIHByb3BlcnRpZXMgdG8gdGhlIG5ldyBvcHRpb25zIG9iamVjdFxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJnc1tfTEVOR1RIX107IGkrKykge1xuICAgICAgdmFyIGFyZ3VtZW50ID0gYXJnc1tpXTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGFyZ3VtZW50KSB7XG4gICAgICAgICAgaWYgKGFyZ3VtZW50Lmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgIG1lcmdlZE9wdGlvbnNba2V5XSA9IGFyZ3VtZW50W2tleV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgcmV0dXJuIG1lcmdlZE9wdGlvbnM7XG4gIH1cblxuXG4gIC8vIEFkZHMgdGhlIHNwZWNpZmllZCBDU1MgdG8gdGhlIGRvY3VtZW50J3MgPGhlYWQ+IGVsZW1lbnRcbiAgZnVuY3Rpb24gYWRkU3R5bGVUb0hlYWQoY3NzKSB7XG4gICAgdmFyIGhlYWQgPSBkb2N1bWVudFtfR0VUX0VMRU1FTlRTX0JZX1RBR19OQU1FX10oJ2hlYWQnKVswXTtcbiAgICBpZiAoaGVhZCkge1xuICAgICAgdmFyIHN0eWxlID0gZG9jdW1lbnRbX0NSRUFURV9FTEVNRU5UX10oX1NUWUxFXyk7XG4gICAgICBzdHlsZS50eXBlID0gJ3RleHQvY3NzJztcbiAgICAgIHN0eWxlLmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNzcykpO1xuICAgICAgaGVhZC5hcHBlbmRDaGlsZChzdHlsZSk7XG4gICAgfVxuICB9XG5cblxuICAvLyBCdWlsZHMgYW4gU1ZHIGVsZW1lbnQgZnJvbSB0aGUgc3BlY2lmaWVkIFNWRyBzdHJpbmdcbiAgZnVuY3Rpb24gYnVpbGRTdmdFbGVtZW50KHN2Z1N0ciwgdmVyaWZ5KSB7XG4gICAgaWYgKHZlcmlmeSkge1xuICAgICAgdmFyIHN2Z0RvYztcbiAgICAgIHRyeSB7XG4gICAgICAgIC8vIFBhcnNlIHRoZSBTVkcgc3RyaW5nIHdpdGggRE9NUGFyc2VyXG4gICAgICAgIHN2Z0RvYyA9IHN2Z1N0cmluZ1RvU3ZnRG9jKHN2Z1N0cik7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgcmV0dXJuIE5VTEw7XG4gICAgICB9XG4gICAgICBpZiAoc3ZnRG9jW19HRVRfRUxFTUVOVFNfQllfVEFHX05BTUVfXSgncGFyc2VyZXJyb3InKVtfTEVOR1RIX10pIHtcbiAgICAgICAgLy8gRE9NUGFyc2VyIGRvZXMgbm90IHRocm93IGFuIGV4Y2VwdGlvbiwgYnV0IGluc3RlYWQgcHV0cyBwYXJzZXJlcnJvciB0YWdzIGluIHRoZSBkb2N1bWVudFxuICAgICAgICByZXR1cm4gTlVMTDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBzdmdEb2MuZG9jdW1lbnRFbGVtZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XG4gICAgICBkaXYuaW5uZXJIVE1MID0gc3ZnU3RyO1xuICAgICAgcmV0dXJuIGRpdi5maXJzdEVsZW1lbnRDaGlsZDtcbiAgICB9XG4gIH1cblxuXG4gIGZ1bmN0aW9uIHJlbW92ZU9uTG9hZEF0dHJpYnV0ZShpbWdFbGVtKSB7XG4gICAgLy8gUmVtb3ZlIHRoZSBvbmxvYWQgYXR0cmlidXRlLiBTaG91bGQgb25seSBiZSB1c2VkIHRvIHJlbW92ZSB0aGUgdW5zdHlsZWQgaW1hZ2UgZmxhc2ggcHJvdGVjdGlvbiBhbmRcbiAgICAvLyBtYWtlIHRoZSBlbGVtZW50IHZpc2libGUsIG5vdCBmb3IgcmVtb3ZpbmcgdGhlIGV2ZW50IGxpc3RlbmVyLlxuICAgIGltZ0VsZW0ucmVtb3ZlQXR0cmlidXRlKCdvbmxvYWQnKTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gZXJyb3JNZXNzYWdlKG1zZykge1xuICAgIGNvbnNvbGUuZXJyb3IoJ1NWR0luamVjdDogJyArIG1zZyk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIGZhaWwoaW1nRWxlbSwgc3RhdHVzLCBvcHRpb25zKSB7XG4gICAgaW1nRWxlbVtfX1NWR0lOSkVDVF0gPSBGQUlMO1xuICAgIGlmIChvcHRpb25zLm9uRmFpbCkge1xuICAgICAgb3B0aW9ucy5vbkZhaWwoaW1nRWxlbSwgc3RhdHVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXJyb3JNZXNzYWdlKHN0YXR1cyk7XG4gICAgfVxuICB9XG5cblxuICBmdW5jdGlvbiBzdmdJbnZhbGlkKGltZ0VsZW0sIG9wdGlvbnMpIHtcbiAgICByZW1vdmVPbkxvYWRBdHRyaWJ1dGUoaW1nRWxlbSk7XG4gICAgZmFpbChpbWdFbGVtLCBTVkdfSU5WQUxJRCwgb3B0aW9ucyk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIHN2Z05vdFN1cHBvcnRlZChpbWdFbGVtLCBvcHRpb25zKSB7XG4gICAgcmVtb3ZlT25Mb2FkQXR0cmlidXRlKGltZ0VsZW0pO1xuICAgIGZhaWwoaW1nRWxlbSwgU1ZHX05PVF9TVVBQT1JURUQsIG9wdGlvbnMpO1xuICB9XG5cblxuICBmdW5jdGlvbiBsb2FkRmFpbChpbWdFbGVtLCBvcHRpb25zKSB7XG4gICAgZmFpbChpbWdFbGVtLCBMT0FEX0ZBSUwsIG9wdGlvbnMpO1xuICB9XG5cblxuICBmdW5jdGlvbiByZW1vdmVFdmVudExpc3RlbmVycyhpbWdFbGVtKSB7XG4gICAgaW1nRWxlbS5vbmxvYWQgPSBOVUxMO1xuICAgIGltZ0VsZW0ub25lcnJvciA9IE5VTEw7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIGltZ05vdFNldChtc2cpIHtcbiAgICBlcnJvck1lc3NhZ2UoJ25vIGltZyBlbGVtZW50Jyk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNWR0luamVjdChnbG9iYWxOYW1lLCBvcHRpb25zKSB7XG4gICAgdmFyIGRlZmF1bHRPcHRpb25zID0gbWVyZ2VPcHRpb25zKERFRkFVTFRfT1BUSU9OUywgb3B0aW9ucyk7XG4gICAgdmFyIHN2Z0xvYWRDYWNoZSA9IHt9O1xuXG4gICAgaWYgKElTX1NWR19TVVBQT1JURUQpIHtcbiAgICAgIC8vIElmIHRoZSBicm93c2VyIHN1cHBvcnRzIFNWRywgYWRkIGEgc21hbGwgc3R5bGVzaGVldCB0aGF0IGhpZGVzIHRoZSA8aW1nPiBlbGVtZW50cyB1bnRpbFxuICAgICAgLy8gaW5qZWN0aW9uIGlzIGZpbmlzaGVkLiBUaGlzIGF2b2lkcyBzaG93aW5nIHRoZSB1bnN0eWxlZCBTVkdzIGJlZm9yZSBzdHlsZSBpcyBhcHBsaWVkLlxuICAgICAgYWRkU3R5bGVUb0hlYWQoJ2ltZ1tvbmxvYWRePVwiJyArIGdsb2JhbE5hbWUgKyAnKFwiXXt2aXNpYmlsaXR5OmhpZGRlbjt9Jyk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBTVkdJbmplY3RcbiAgICAgKlxuICAgICAqIEluamVjdHMgdGhlIFNWRyBzcGVjaWZpZWQgaW4gdGhlIGBzcmNgIGF0dHJpYnV0ZSBvZiB0aGUgc3BlY2lmaWVkIGBpbWdgIGVsZW1lbnQgb3IgYXJyYXkgb2YgYGltZ2BcbiAgICAgKiBlbGVtZW50cy4gUmV0dXJucyBhIFByb21pc2Ugb2JqZWN0IHdoaWNoIHJlc29sdmVzIGlmIGFsbCBwYXNzZWQgaW4gYGltZ2AgZWxlbWVudHMgaGF2ZSBlaXRoZXIgYmVlblxuICAgICAqIGluamVjdGVkIG9yIGZhaWxlZCB0byBpbmplY3QgKE9ubHkgaWYgYSBnbG9iYWwgUHJvbWlzZSBvYmplY3QgaXMgYXZhaWxhYmxlIGxpa2UgaW4gYWxsIG1vZGVybiBicm93c2Vyc1xuICAgICAqIG9yIHRocm91Z2ggYSBwb2x5ZmlsbCkuXG4gICAgICpcbiAgICAgKiBPcHRpb25zOlxuICAgICAqIHVzZUNhY2hlOiBJZiBzZXQgdG8gYHRydWVgIHRoZSBTVkcgd2lsbCBiZSBjYWNoZWQgdXNpbmcgdGhlIGFic29sdXRlIFVSTC4gRGVmYXVsdCB2YWx1ZSBpcyBgdHJ1ZWAuXG4gICAgICogY29weUF0dHJpYnV0ZXM6IElmIHNldCB0byBgdHJ1ZWAgdGhlIGF0dHJpYnV0ZXMgd2lsbCBiZSBjb3BpZWQgZnJvbSBgaW1nYCB0byBgc3ZnYC4gRGZhdWx0IHZhbHVlXG4gICAgICogICAgIGlzIGB0cnVlYC5cbiAgICAgKiBtYWtlSWRzVW5pcXVlOiBJZiBzZXQgdG8gYHRydWVgIHRoZSBJRCBvZiBlbGVtZW50cyBpbiB0aGUgYDxkZWZzPmAgZWxlbWVudCB0aGF0IGNhbiBiZSByZWZlcmVuY2VzIGJ5XG4gICAgICogICAgIHByb3BlcnR5IHZhbHVlcyAoZm9yIGV4YW1wbGUgJ2NsaXBQYXRoJykgYXJlIG1hZGUgdW5pcXVlIGJ5IGFwcGVuZGluZyBcIi0taW5qZWN0LVhcIiwgd2hlcmUgWCBpcyBhXG4gICAgICogICAgIHJ1bm5pbmcgbnVtYmVyIHdoaWNoIGluY3JlYXNlcyB3aXRoIGVhY2ggaW5qZWN0aW9uLiBUaGlzIGlzIGRvbmUgdG8gYXZvaWQgZHVwbGljYXRlIElEcyBpbiB0aGUgRE9NLlxuICAgICAqIGJlZm9yZUxvYWQ6IEhvb2sgYmVmb3JlIFNWRyBpcyBsb2FkZWQuIFRoZSBgaW1nYCBlbGVtZW50IGlzIHBhc3NlZCBhcyBhIHBhcmFtZXRlci4gSWYgdGhlIGhvb2sgcmV0dXJuc1xuICAgICAqICAgICBhIHN0cmluZyBpdCBpcyB1c2VkIGFzIHRoZSBVUkwgaW5zdGVhZCBvZiB0aGUgYGltZ2AgZWxlbWVudCdzIGBzcmNgIGF0dHJpYnV0ZS5cbiAgICAgKiBhZnRlckxvYWQ6IEhvb2sgYWZ0ZXIgU1ZHIGlzIGxvYWRlZC4gVGhlIGxvYWRlZCBgc3ZnYCBlbGVtZW50IGFuZCBgc3ZnYCBzdHJpbmcgYXJlIHBhc3NlZCBhcyBhXG4gICAgICogICAgIHBhcmFtZXRlcnMuIElmIGNhY2hpbmcgaXMgYWN0aXZlIHRoaXMgaG9vayB3aWxsIG9ubHkgZ2V0IGNhbGxlZCBvbmNlIGZvciBpbmplY3RlZCBTVkdzIHdpdGggdGhlXG4gICAgICogICAgIHNhbWUgYWJzb2x1dGUgcGF0aC4gQ2hhbmdlcyB0byB0aGUgYHN2Z2AgZWxlbWVudCBpbiB0aGlzIGhvb2sgd2lsbCBiZSBhcHBsaWVkIHRvIGFsbCBpbmplY3RlZCBTVkdzXG4gICAgICogICAgIHdpdGggdGhlIHNhbWUgYWJzb2x1dGUgcGF0aC4gSXQncyBhbHNvIHBvc3NpYmxlIHRvIHJldHVybiBhbiBgc3ZnYCBzdHJpbmcgb3IgYHN2Z2AgZWxlbWVudCB3aGljaFxuICAgICAqICAgICB3aWxsIHRoZW4gYmUgdXNlZCBmb3IgdGhlIGluamVjdGlvbi5cbiAgICAgKiBiZWZvcmVJbmplY3Q6IEhvb2sgYmVmb3JlIFNWRyBpcyBpbmplY3RlZC4gVGhlIGBpbWdgIGFuZCBgc3ZnYCBlbGVtZW50cyBhcmUgcGFzc2VkIGFzIHBhcmFtZXRlcnMuIElmXG4gICAgICogICAgIGFueSBodG1sIGVsZW1lbnQgaXMgcmV0dXJuZWQgaXQgZ2V0cyBpbmplY3RlZCBpbnN0ZWFkIG9mIGFwcGx5aW5nIHRoZSBkZWZhdWx0IFNWRyBpbmplY3Rpb24uXG4gICAgICogYWZ0ZXJJbmplY3Q6IEhvb2sgYWZ0ZXIgU1ZHIGlzIGluamVjdGVkLiBUaGUgYGltZ2AgYW5kIGBzdmdgIGVsZW1lbnRzIGFyZSBwYXNzZWQgYXMgcGFyYW1ldGVycy5cbiAgICAgKiBvbkFsbEZpbmlzaDogSG9vayBhZnRlciBhbGwgYGltZ2AgZWxlbWVudHMgcGFzc2VkIHRvIGFuIFNWR0luamVjdCgpIGNhbGwgaGF2ZSBlaXRoZXIgYmVlbiBpbmplY3RlZCBvclxuICAgICAqICAgICBmYWlsZWQgdG8gaW5qZWN0LlxuICAgICAqIG9uRmFpbDogSG9vayBhZnRlciBpbmplY3Rpb24gZmFpbHMuIFRoZSBgaW1nYCBlbGVtZW50IGFuZCBhIGBzdGF0dXNgIHN0cmluZyBhcmUgcGFzc2VkIGFzIGFuIHBhcmFtZXRlci5cbiAgICAgKiAgICAgVGhlIGBzdGF0dXNgIGNhbiBiZSBlaXRoZXIgYCdTVkdfTk9UX1NVUFBPUlRFRCdgICh0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IFNWRyksXG4gICAgICogICAgIGAnU1ZHX0lOVkFMSUQnYCAodGhlIFNWRyBpcyBub3QgaW4gYSB2YWxpZCBmb3JtYXQpIG9yIGAnTE9BRF9GQUlMRUQnYCAobG9hZGluZyBvZiB0aGUgU1ZHIGZhaWxlZCkuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge0hUTUxJbWFnZUVsZW1lbnR9IGltZyAtIGFuIGltZyBlbGVtZW50IG9yIGFuIGFycmF5IG9mIGltZyBlbGVtZW50c1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbb3B0aW9uc10gLSBvcHRpb25hbCBwYXJhbWV0ZXIgd2l0aCBbb3B0aW9uc10oI29wdGlvbnMpIGZvciB0aGlzIGluamVjdGlvbi5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBTVkdJbmplY3QoaW1nLCBvcHRpb25zKSB7XG4gICAgICBvcHRpb25zID0gbWVyZ2VPcHRpb25zKGRlZmF1bHRPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgdmFyIHJ1biA9IGZ1bmN0aW9uKHJlc29sdmUpIHtcbiAgICAgICAgdmFyIGFsbEZpbmlzaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBvbkFsbEZpbmlzaCA9IG9wdGlvbnMub25BbGxGaW5pc2g7XG4gICAgICAgICAgaWYgKG9uQWxsRmluaXNoKSB7XG4gICAgICAgICAgICBvbkFsbEZpbmlzaCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXNvbHZlICYmIHJlc29sdmUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoaW1nICYmIHR5cGVvZiBpbWdbX0xFTkdUSF9dICE9IF9VTkRFRklORURfKSB7XG4gICAgICAgICAgLy8gYW4gYXJyYXkgbGlrZSBzdHJ1Y3R1cmUgb2YgaW1nIGVsZW1lbnRzXG4gICAgICAgICAgdmFyIGluamVjdEluZGV4ID0gMDtcbiAgICAgICAgICB2YXIgaW5qZWN0Q291bnQgPSBpbWdbX0xFTkdUSF9dO1xuXG4gICAgICAgICAgaWYgKGluamVjdENvdW50ID09IDApIHtcbiAgICAgICAgICAgIGFsbEZpbmlzaCgpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgZmluaXNoID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGlmICgrK2luamVjdEluZGV4ID09IGluamVjdENvdW50KSB7XG4gICAgICAgICAgICAgICAgYWxsRmluaXNoKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgaW5qZWN0Q291bnQ7IGkrKykge1xuICAgICAgICAgICAgICBTVkdJbmplY3RFbGVtZW50KGltZ1tpXSwgb3B0aW9ucywgZmluaXNoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gb25seSBvbmUgaW1nIGVsZW1lbnRcbiAgICAgICAgICBTVkdJbmplY3RFbGVtZW50KGltZywgb3B0aW9ucywgYWxsRmluaXNoKTtcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgLy8gcmV0dXJuIGEgUHJvbWlzZSBvYmplY3QgaWYgZ2xvYmFsbHkgYXZhaWxhYmxlXG4gICAgICByZXR1cm4gdHlwZW9mIFByb21pc2UgPT0gX1VOREVGSU5FRF8gPyBydW4oKSA6IG5ldyBQcm9taXNlKHJ1bik7XG4gICAgfVxuXG5cbiAgICAvLyBJbmplY3RzIGEgc2luZ2xlIHN2ZyBlbGVtZW50LiBPcHRpb25zIG11c3QgYmUgYWxyZWFkeSBtZXJnZWQgd2l0aCB0aGUgZGVmYXVsdCBvcHRpb25zLlxuICAgIGZ1bmN0aW9uIFNWR0luamVjdEVsZW1lbnQoaW1nRWxlbSwgb3B0aW9ucywgY2FsbGJhY2spIHtcbiAgICAgIGlmIChpbWdFbGVtKSB7XG4gICAgICAgIHZhciBzdmdJbmplY3RBdHRyaWJ1dGVWYWx1ZSA9IGltZ0VsZW1bX19TVkdJTkpFQ1RdO1xuICAgICAgICBpZiAoIXN2Z0luamVjdEF0dHJpYnV0ZVZhbHVlKSB7XG4gICAgICAgICAgcmVtb3ZlRXZlbnRMaXN0ZW5lcnMoaW1nRWxlbSk7XG5cbiAgICAgICAgICBpZiAoIUlTX1NWR19TVVBQT1JURUQpIHtcbiAgICAgICAgICAgIHN2Z05vdFN1cHBvcnRlZChpbWdFbGVtLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIEludm9rZSBiZWZvcmVMb2FkIGhvb2sgaWYgc2V0LiBJZiB0aGUgYmVmb3JlTG9hZCByZXR1cm5zIGEgdmFsdWUgdXNlIGl0IGFzIHRoZSBzcmMgZm9yIHRoZSBsb2FkXG4gICAgICAgICAgLy8gVVJMIHBhdGguIEVsc2UgdXNlIHRoZSBpbWdFbGVtJ3Mgc3JjIGF0dHJpYnV0ZSB2YWx1ZS5cbiAgICAgICAgICB2YXIgYmVmb3JlTG9hZCA9IG9wdGlvbnMuYmVmb3JlTG9hZDtcbiAgICAgICAgICB2YXIgc3JjID0gKGJlZm9yZUxvYWQgJiYgYmVmb3JlTG9hZChpbWdFbGVtKSkgfHwgaW1nRWxlbVtfR0VUX0FUVFJJQlVURV9dKCdzcmMnKTtcblxuICAgICAgICAgIGlmICghc3JjKSB7XG4gICAgICAgICAgICAvLyBJZiBubyBpbWFnZSBzcmMgYXR0cmlidXRlIGlzIHNldCBkbyBubyBpbmplY3Rpb24uIFRoaXMgY2FuIG9ubHkgYmUgcmVhY2hlZCBieSB1c2luZyBqYXZhc2NyaXB0XG4gICAgICAgICAgICAvLyBiZWNhdXNlIGlmIG5vIHNyYyBhdHRyaWJ1dGUgaXMgc2V0IHRoZSBvbmxvYWQgYW5kIG9uZXJyb3IgZXZlbnRzIGRvIG5vdCBnZXQgY2FsbGVkXG4gICAgICAgICAgICBpZiAoc3JjID09PSAnJykge1xuICAgICAgICAgICAgICBsb2FkRmFpbChpbWdFbGVtLCBvcHRpb25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gc2V0IGFycmF5IHNvIGxhdGVyIGNhbGxzIGNhbiByZWdpc3RlciBjYWxsYmFja3NcbiAgICAgICAgICB2YXIgb25GaW5pc2hDYWxsYmFja3MgPSBbXTtcbiAgICAgICAgICBpbWdFbGVtW19fU1ZHSU5KRUNUXSA9IG9uRmluaXNoQ2FsbGJhY2tzO1xuXG4gICAgICAgICAgdmFyIG9uRmluaXNoID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgb25GaW5pc2hDYWxsYmFja3MuZm9yRWFjaChmdW5jdGlvbihvbkZpbmlzaENhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIG9uRmluaXNoQ2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB2YXIgYWJzVXJsID0gZ2V0QWJzb2x1dGVVcmwoc3JjKTtcbiAgICAgICAgICB2YXIgdXNlQ2FjaGVPcHRpb24gPSBvcHRpb25zLnVzZUNhY2hlO1xuICAgICAgICAgIHZhciBtYWtlSWRzVW5pcXVlT3B0aW9uID0gb3B0aW9ucy5tYWtlSWRzVW5pcXVlO1xuICAgICAgICAgIFxuICAgICAgICAgIHZhciBzZXRTdmdMb2FkQ2FjaGVWYWx1ZSA9IGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICAgICAgaWYgKHVzZUNhY2hlT3B0aW9uKSB7XG4gICAgICAgICAgICAgIHN2Z0xvYWRDYWNoZVthYnNVcmxdLmZvckVhY2goZnVuY3Rpb24oc3ZnTG9hZCkge1xuICAgICAgICAgICAgICAgIHN2Z0xvYWQodmFsKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIHN2Z0xvYWRDYWNoZVthYnNVcmxdID0gdmFsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBpZiAodXNlQ2FjaGVPcHRpb24pIHtcbiAgICAgICAgICAgIHZhciBzdmdMb2FkID0gc3ZnTG9hZENhY2hlW2Fic1VybF07XG5cbiAgICAgICAgICAgIHZhciBoYW5kbGVMb2FkVmFsdWUgPSBmdW5jdGlvbihsb2FkVmFsdWUpIHtcbiAgICAgICAgICAgICAgaWYgKGxvYWRWYWx1ZSA9PT0gTE9BRF9GQUlMKSB7XG4gICAgICAgICAgICAgICAgbG9hZEZhaWwoaW1nRWxlbSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAobG9hZFZhbHVlID09PSBTVkdfSU5WQUxJRCkge1xuICAgICAgICAgICAgICAgIHN2Z0ludmFsaWQoaW1nRWxlbSwgb3B0aW9ucyk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIGhhc1VuaXF1ZUlkcyA9IGxvYWRWYWx1ZVswXTtcbiAgICAgICAgICAgICAgICB2YXIgc3ZnU3RyaW5nID0gbG9hZFZhbHVlWzFdO1xuICAgICAgICAgICAgICAgIHZhciB1bmlxdWVJZHNTdmdTdHJpbmcgPSBsb2FkVmFsdWVbMl07XG4gICAgICAgICAgICAgICAgdmFyIHN2Z0VsZW07XG5cbiAgICAgICAgICAgICAgICBpZiAobWFrZUlkc1VuaXF1ZU9wdGlvbikge1xuICAgICAgICAgICAgICAgICAgaWYgKGhhc1VuaXF1ZUlkcyA9PT0gTlVMTCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBJRHMgZm9yIHRoZSBTVkcgc3RyaW5nIGhhdmUgbm90IGJlZW4gbWFkZSB1bmlxdWUgYmVmb3JlLiBUaGlzIG1heSBoYXBwZW4gaWYgcHJldmlvdXNcbiAgICAgICAgICAgICAgICAgICAgLy8gaW5qZWN0aW9uIG9mIGEgY2FjaGVkIFNWRyBoYXZlIGJlZW4gcnVuIHdpdGggdGhlIG9wdGlvbiBtYWtlZElkc1VuaXF1ZSBzZXQgdG8gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgc3ZnRWxlbSA9IGJ1aWxkU3ZnRWxlbWVudChzdmdTdHJpbmcsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgaGFzVW5pcXVlSWRzID0gbWFrZUlkc1VuaXF1ZShzdmdFbGVtLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgbG9hZFZhbHVlWzBdID0gaGFzVW5pcXVlSWRzO1xuICAgICAgICAgICAgICAgICAgICBsb2FkVmFsdWVbMl0gPSBoYXNVbmlxdWVJZHMgJiYgc3ZnRWxlbVRvU3ZnU3RyaW5nKHN2Z0VsZW0pO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChoYXNVbmlxdWVJZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gTWFrZSBJRHMgdW5pcXVlIGZvciBhbHJlYWR5IGNhY2hlZCBTVkdzIHdpdGggYmV0dGVyIHBlcmZvcm1hbmNlXG4gICAgICAgICAgICAgICAgICAgIHN2Z1N0cmluZyA9IG1ha2VJZHNVbmlxdWVDYWNoZWQodW5pcXVlSWRzU3ZnU3RyaW5nKTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzdmdFbGVtID0gc3ZnRWxlbSB8fCBidWlsZFN2Z0VsZW1lbnQoc3ZnU3RyaW5nLCBmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICBpbmplY3QoaW1nRWxlbSwgc3ZnRWxlbSwgYWJzVXJsLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBvbkZpbmlzaCgpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBzdmdMb2FkICE9IF9VTkRFRklORURfKSB7XG4gICAgICAgICAgICAgIC8vIFZhbHVlIGZvciB1cmwgZXhpc3RzIGluIGNhY2hlXG4gICAgICAgICAgICAgIGlmIChzdmdMb2FkLmlzQ2FsbGJhY2tRdWV1ZSkge1xuICAgICAgICAgICAgICAgIC8vIFNhbWUgdXJsIGhhcyBiZWVuIGNhY2hlZCwgYnV0IHZhbHVlIGhhcyBub3QgYmVlbiBsb2FkZWQgeWV0LCBzbyBhZGQgdG8gY2FsbGJhY2tzXG4gICAgICAgICAgICAgICAgc3ZnTG9hZC5wdXNoKGhhbmRsZUxvYWRWYWx1ZSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlTG9hZFZhbHVlKHN2Z0xvYWQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHZhciBzdmdMb2FkID0gW107XG4gICAgICAgICAgICAgIC8vIHNldCBwcm9wZXJ0eSBpc0NhbGxiYWNrUXVldWUgdG8gQXJyYXkgdG8gZGlmZmVyZW50aWF0ZSBmcm9tIGFycmF5IHdpdGggY2FjaGVkIGxvYWRlZCB2YWx1ZXNcbiAgICAgICAgICAgICAgc3ZnTG9hZC5pc0NhbGxiYWNrUXVldWUgPSB0cnVlO1xuICAgICAgICAgICAgICBzdmdMb2FkQ2FjaGVbYWJzVXJsXSA9IHN2Z0xvYWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gTG9hZCB0aGUgU1ZHIGJlY2F1c2UgaXQgaXMgbm90IGNhY2hlZCBvciBjYWNoaW5nIGlzIGRpc2FibGVkXG4gICAgICAgICAgbG9hZFN2ZyhhYnNVcmwsIGZ1bmN0aW9uKHN2Z1htbCwgc3ZnU3RyaW5nKSB7XG4gICAgICAgICAgICAvLyBVc2UgdGhlIFhNTCBmcm9tIHRoZSBYSFIgcmVxdWVzdCBpZiBpdCBpcyBhbiBpbnN0YW5jZSBvZiBEb2N1bWVudC4gT3RoZXJ3aXNlXG4gICAgICAgICAgICAvLyAoZm9yIGV4YW1wbGUgb2YgSUU5KSwgY3JlYXRlIHRoZSBzdmcgZG9jdW1lbnQgZnJvbSB0aGUgc3ZnIHN0cmluZy5cbiAgICAgICAgICAgIHZhciBzdmdFbGVtID0gc3ZnWG1sIGluc3RhbmNlb2YgRG9jdW1lbnQgPyBzdmdYbWwuZG9jdW1lbnRFbGVtZW50IDogYnVpbGRTdmdFbGVtZW50KHN2Z1N0cmluZywgdHJ1ZSk7XG5cbiAgICAgICAgICAgIHZhciBhZnRlckxvYWQgPSBvcHRpb25zLmFmdGVyTG9hZDtcbiAgICAgICAgICAgIGlmIChhZnRlckxvYWQpIHtcbiAgICAgICAgICAgICAgLy8gSW52b2tlIGFmdGVyTG9hZCBob29rIHdoaWNoIG1heSBtb2RpZnkgdGhlIFNWRyBlbGVtZW50LiBBZnRlciBsb2FkIG1heSBhbHNvIHJldHVybiBhIG5ld1xuICAgICAgICAgICAgICAvLyBzdmcgZWxlbWVudCBvciBzdmcgc3RyaW5nXG4gICAgICAgICAgICAgIHZhciBzdmdFbGVtT3JTdmdTdHJpbmcgPSBhZnRlckxvYWQoc3ZnRWxlbSwgc3ZnU3RyaW5nKSB8fCBzdmdFbGVtO1xuICAgICAgICAgICAgICBpZiAoc3ZnRWxlbU9yU3ZnU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgLy8gVXBkYXRlIHN2Z0VsZW0gYW5kIHN2Z1N0cmluZyBiZWNhdXNlIG9mIG1vZGlmaWNhdGlvbnMgdG8gdGhlIFNWRyBlbGVtZW50IG9yIFNWRyBzdHJpbmcgaW5cbiAgICAgICAgICAgICAgICAvLyB0aGUgYWZ0ZXJMb2FkIGhvb2ssIHNvIHRoZSBtb2RpZmllZCBTVkcgaXMgYWxzbyB1c2VkIGZvciBhbGwgbGF0ZXIgY2FjaGVkIGluamVjdGlvbnNcbiAgICAgICAgICAgICAgICB2YXIgaXNTdHJpbmcgPSB0eXBlb2Ygc3ZnRWxlbU9yU3ZnU3RyaW5nID09ICdzdHJpbmcnO1xuICAgICAgICAgICAgICAgIHN2Z1N0cmluZyA9IGlzU3RyaW5nID8gc3ZnRWxlbU9yU3ZnU3RyaW5nIDogc3ZnRWxlbVRvU3ZnU3RyaW5nKHN2Z0VsZW0pO1xuICAgICAgICAgICAgICAgIHN2Z0VsZW0gPSBpc1N0cmluZyA/IGJ1aWxkU3ZnRWxlbWVudChzdmdFbGVtT3JTdmdTdHJpbmcsIHRydWUpIDogc3ZnRWxlbU9yU3ZnU3RyaW5nO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzdmdFbGVtIGluc3RhbmNlb2YgU1ZHRWxlbWVudCkge1xuICAgICAgICAgICAgICB2YXIgaGFzVW5pcXVlSWRzID0gTlVMTDtcbiAgICAgICAgICAgICAgaWYgKG1ha2VJZHNVbmlxdWVPcHRpb24pIHtcbiAgICAgICAgICAgICAgICBoYXNVbmlxdWVJZHMgPSBtYWtlSWRzVW5pcXVlKHN2Z0VsZW0sIGZhbHNlKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGlmICh1c2VDYWNoZU9wdGlvbikge1xuICAgICAgICAgICAgICAgIHZhciB1bmlxdWVJZHNTdmdTdHJpbmcgPSBoYXNVbmlxdWVJZHMgJiYgc3ZnRWxlbVRvU3ZnU3RyaW5nKHN2Z0VsZW0pO1xuICAgICAgICAgICAgICAgIC8vIHNldCBhbiBhcnJheSB3aXRoIHRocmVlIGVudHJpZXMgdG8gdGhlIGxvYWQgY2FjaGVcbiAgICAgICAgICAgICAgICBzZXRTdmdMb2FkQ2FjaGVWYWx1ZShbaGFzVW5pcXVlSWRzLCBzdmdTdHJpbmcsIHVuaXF1ZUlkc1N2Z1N0cmluZ10pO1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgaW5qZWN0KGltZ0VsZW0sIHN2Z0VsZW0sIGFic1VybCwgb3B0aW9ucyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBzdmdJbnZhbGlkKGltZ0VsZW0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgICBzZXRTdmdMb2FkQ2FjaGVWYWx1ZShTVkdfSU5WQUxJRCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBvbkZpbmlzaCgpO1xuICAgICAgICAgIH0sIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbG9hZEZhaWwoaW1nRWxlbSwgb3B0aW9ucyk7XG4gICAgICAgICAgICBzZXRTdmdMb2FkQ2FjaGVWYWx1ZShMT0FEX0ZBSUwpO1xuICAgICAgICAgICAgb25GaW5pc2goKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzdmdJbmplY3RBdHRyaWJ1dGVWYWx1ZSkpIHtcbiAgICAgICAgICAgIC8vIHN2Z0luamVjdEF0dHJpYnV0ZVZhbHVlIGlzIGFuIGFycmF5LiBJbmplY3Rpb24gaXMgbm90IGNvbXBsZXRlIHNvIHJlZ2lzdGVyIGNhbGxiYWNrXG4gICAgICAgICAgICBzdmdJbmplY3RBdHRyaWJ1dGVWYWx1ZS5wdXNoKGNhbGxiYWNrKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGltZ05vdFNldCgpO1xuICAgICAgfVxuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogU2V0cyB0aGUgZGVmYXVsdCBbb3B0aW9uc10oI29wdGlvbnMpIGZvciBTVkdJbmplY3QuXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge09iamVjdH0gW29wdGlvbnNdIC0gZGVmYXVsdCBbb3B0aW9uc10oI29wdGlvbnMpIGZvciBhbiBpbmplY3Rpb24uXG4gICAgICovXG4gICAgU1ZHSW5qZWN0LnNldE9wdGlvbnMgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICBkZWZhdWx0T3B0aW9ucyA9IG1lcmdlT3B0aW9ucyhkZWZhdWx0T3B0aW9ucywgb3B0aW9ucyk7XG4gICAgfTtcblxuXG4gICAgLy8gQ3JlYXRlIGEgbmV3IGluc3RhbmNlIG9mIFNWR0luamVjdFxuICAgIFNWR0luamVjdC5jcmVhdGUgPSBjcmVhdGVTVkdJbmplY3Q7XG5cblxuICAgIC8qKlxuICAgICAqIFVzZWQgaW4gb25lcnJvciBFdmVudCBvZiBhbiBgPGltZz5gIGVsZW1lbnQgdG8gaGFuZGxlIGNhc2VzIHdoZW4gdGhlIGxvYWRpbmcgdGhlIG9yaWdpbmFsIHNyYyBmYWlsc1xuICAgICAqIChmb3IgZXhhbXBsZSBpZiBmaWxlIGlzIG5vdCBmb3VuZCBvciBpZiB0aGUgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IFNWRykuIFRoaXMgdHJpZ2dlcnMgYSBjYWxsIHRvIHRoZVxuICAgICAqIG9wdGlvbnMgb25GYWlsIGhvb2sgaWYgYXZhaWxhYmxlLiBUaGUgb3B0aW9uYWwgc2Vjb25kIHBhcmFtZXRlciB3aWxsIGJlIHNldCBhcyB0aGUgbmV3IHNyYyBhdHRyaWJ1dGVcbiAgICAgKiBmb3IgdGhlIGltZyBlbGVtZW50LlxuICAgICAqXG4gICAgICogQHBhcmFtIHtIVE1MSW1hZ2VFbGVtZW50fSBpbWcgLSBhbiBpbWcgZWxlbWVudFxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbZmFsbGJhY2tTcmNdIC0gb3B0aW9uYWwgcGFyYW1ldGVyIGZhbGxiYWNrIHNyY1xuICAgICAqL1xuICAgIFNWR0luamVjdC5lcnIgPSBmdW5jdGlvbihpbWcsIGZhbGxiYWNrU3JjKSB7XG4gICAgICBpZiAoaW1nKSB7XG4gICAgICAgIGlmIChpbWdbX19TVkdJTkpFQ1RdICE9IEZBSUwpIHtcbiAgICAgICAgICByZW1vdmVFdmVudExpc3RlbmVycyhpbWcpO1xuXG4gICAgICAgICAgaWYgKCFJU19TVkdfU1VQUE9SVEVEKSB7XG4gICAgICAgICAgICBzdmdOb3RTdXBwb3J0ZWQoaW1nLCBkZWZhdWx0T3B0aW9ucyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlbW92ZU9uTG9hZEF0dHJpYnV0ZShpbWcpO1xuICAgICAgICAgICAgbG9hZEZhaWwoaW1nLCBkZWZhdWx0T3B0aW9ucyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChmYWxsYmFja1NyYykge1xuICAgICAgICAgICAgcmVtb3ZlT25Mb2FkQXR0cmlidXRlKGltZyk7XG4gICAgICAgICAgICBpbWcuc3JjID0gZmFsbGJhY2tTcmM7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbWdOb3RTZXQoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgd2luZG93W2dsb2JhbE5hbWVdID0gU1ZHSW5qZWN0O1xuXG4gICAgcmV0dXJuIFNWR0luamVjdDtcbiAgfVxuXG4gIHZhciBTVkdJbmplY3RJbnN0YW5jZSA9IGNyZWF0ZVNWR0luamVjdCgnU1ZHSW5qZWN0Jyk7XG5cbiAgaWYgKHR5cGVvZiBtb2R1bGUgPT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBTVkdJbmplY3RJbnN0YW5jZTtcbiAgfVxufSkod2luZG93LCBkb2N1bWVudCk7IiwiLy8gSW1wb3J0c1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18gZnJvbSBcIi4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9zb3VyY2VNYXBzLmpzXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fIGZyb20gXCIuLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9HRVRfVVJMX0lNUE9SVF9fXyBmcm9tIFwiLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2dldFVybC5qc1wiO1xudmFyIF9fX0NTU19MT0FERVJfVVJMX0lNUE9SVF8wX19fID0gbmV3IFVSTChcIi4vYXNzZXRzL2ZvbnRzL1JvYm90b19Db25kZW5zZWQvc3RhdGljL1JvYm90b0NvbmRlbnNlZC1NZWRpdW0udHRmXCIsIGltcG9ydC5tZXRhLnVybCk7XG52YXIgX19fQ1NTX0xPQURFUl9FWFBPUlRfX18gPSBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyk7XG52YXIgX19fQ1NTX0xPQURFUl9VUkxfUkVQTEFDRU1FTlRfMF9fXyA9IF9fX0NTU19MT0FERVJfR0VUX1VSTF9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9VUkxfSU1QT1JUXzBfX18pO1xuLy8gTW9kdWxlXG5fX19DU1NfTE9BREVSX0VYUE9SVF9fXy5wdXNoKFttb2R1bGUuaWQsIGBAZm9udC1mYWNlIHtcbiAgLyogaHR0cHM6Ly9mb250cy5nb29nbGUuY29tL3NwZWNpbWVuL1JvYm90bytDb25kZW5zZWQgKi9cbiAgZm9udC1mYW1pbHk6ICdSb2JvdG8gQ29uZGVuc2VkJztcbiAgc3JjOiB1cmwoJHtfX19DU1NfTE9BREVSX1VSTF9SRVBMQUNFTUVOVF8wX19ffSk7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIGZvbnQtc3R5bGU6IG5vcm1hbDtcbn1cblxuOnJvb3Qge1xuICAtLXNlY3Rpb24taGVhZGluZy10ZXh0LWFsaWduOiBjZW50ZXI7XG4gIC0tc2VjdGlvbi1oZWFkaW5nLXBhZGRpbmc6IDFyZW07XG4gIC0tc2VjdGlvbi1oZWFkaW5nLWZvbnQtc2l6ZTogY2xhbXAoMS41cmVtLCAxcmVtICsgMi41dncsIDRyZW0pO1xufVxuXG4qLFxuKjo6YmVmb3JlLFxuKjo6YWZ0ZXIge1xuICBwYWRkaW5nOiAwO1xuICBtYXJnaW46IDA7XG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XG59XG5cbmJvZHkge1xuICBtaW4taGVpZ2h0OiAxMDBzdmg7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZjliNzE7XG4gIGZvbnQtZmFtaWx5OiAnUm9ib3RvIENvbmRlbnNlZCcsIEFyaWFsO1xuICBmb250LWZhbWlseTogJ1JvYm90byBDb25kZW5zZWQnO1xuICBmb250LWZhbWlseTogQXJpYWw7XG59XG5cbi5pY29uIHtcbiAgd2lkdGg6IDMycHg7XG4gIGhlaWdodDogYXV0bztcbn1cbmAsIFwiXCIse1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wid2VicGFjazovLy4vc3JjL2FwcC5jc3NcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIkFBQUE7RUFDRSx1REFBdUQ7RUFDdkQsK0JBQStCO0VBQy9CLDRDQUEyRTtFQUMzRSxnQkFBZ0I7RUFDaEIsa0JBQWtCO0FBQ3BCOztBQUVBO0VBQ0Usb0NBQW9DO0VBQ3BDLCtCQUErQjtFQUMvQiw4REFBOEQ7QUFDaEU7O0FBRUE7OztFQUdFLFVBQVU7RUFDVixTQUFTO0VBQ1Qsc0JBQXNCO0FBQ3hCOztBQUVBO0VBQ0Usa0JBQWtCO0VBQ2xCLHlCQUF5QjtFQUN6QixzQ0FBc0M7RUFDdEMsK0JBQStCO0VBQy9CLGtCQUFrQjtBQUNwQjs7QUFFQTtFQUNFLFdBQVc7RUFDWCxZQUFZO0FBQ2RcIixcInNvdXJjZXNDb250ZW50XCI6W1wiQGZvbnQtZmFjZSB7XFxuICAvKiBodHRwczovL2ZvbnRzLmdvb2dsZS5jb20vc3BlY2ltZW4vUm9ib3RvK0NvbmRlbnNlZCAqL1xcbiAgZm9udC1mYW1pbHk6ICdSb2JvdG8gQ29uZGVuc2VkJztcXG4gIHNyYzogdXJsKC4vYXNzZXRzL2ZvbnRzL1JvYm90b19Db25kZW5zZWQvc3RhdGljL1JvYm90b0NvbmRlbnNlZC1NZWRpdW0udHRmKTtcXG4gIGZvbnQtd2VpZ2h0OiA2MDA7XFxuICBmb250LXN0eWxlOiBub3JtYWw7XFxufVxcblxcbjpyb290IHtcXG4gIC0tc2VjdGlvbi1oZWFkaW5nLXRleHQtYWxpZ246IGNlbnRlcjtcXG4gIC0tc2VjdGlvbi1oZWFkaW5nLXBhZGRpbmc6IDFyZW07XFxuICAtLXNlY3Rpb24taGVhZGluZy1mb250LXNpemU6IGNsYW1wKDEuNXJlbSwgMXJlbSArIDIuNXZ3LCA0cmVtKTtcXG59XFxuXFxuKixcXG4qOjpiZWZvcmUsXFxuKjo6YWZ0ZXIge1xcbiAgcGFkZGluZzogMDtcXG4gIG1hcmdpbjogMDtcXG4gIGJveC1zaXppbmc6IGJvcmRlci1ib3g7XFxufVxcblxcbmJvZHkge1xcbiAgbWluLWhlaWdodDogMTAwc3ZoO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmOWI3MTtcXG4gIGZvbnQtZmFtaWx5OiAnUm9ib3RvIENvbmRlbnNlZCcsIEFyaWFsO1xcbiAgZm9udC1mYW1pbHk6ICdSb2JvdG8gQ29uZGVuc2VkJztcXG4gIGZvbnQtZmFtaWx5OiBBcmlhbDtcXG59XFxuXFxuLmljb24ge1xcbiAgd2lkdGg6IDMycHg7XFxuICBoZWlnaHQ6IGF1dG87XFxufVxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuLy8gRXhwb3J0c1xuZXhwb3J0IGRlZmF1bHQgX19fQ1NTX0xPQURFUl9FWFBPUlRfX187XG4iLCIvLyBJbXBvcnRzXG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL3NvdXJjZU1hcHMuanNcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18gZnJvbSBcIi4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9hcGkuanNcIjtcbnZhciBfX19DU1NfTE9BREVSX0VYUE9SVF9fXyA9IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fKTtcbi8vIE1vZHVsZVxuX19fQ1NTX0xPQURFUl9FWFBPUlRfX18ucHVzaChbbW9kdWxlLmlkLCBgLmFib3V0X2xlZnQge1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gIGRpc3BsYXk6IGdyaWQ7XG59XG5cbi5hYm91dF9sZWZ0ID4gLmltZ19hYm91dCB7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICB3aWR0aDogMTAwJTtcbiAgcGFkZGluZzogMXJlbTtcbn1cblxuLmFib3V0X2xlZnQgPiBoMiB7XG4gIGZvbnQtc2l6ZTogNHJlbTtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBqdXN0aWZ5LXNlbGY6IGNlbnRlcjtcbiAgYWxpZ24tc2VsZjogZW5kO1xuICBtYXJnaW46IDJyZW07XG59XG5cbi5hYm91dF9yaWdodCA+IGgyIHtcbiAgdGV4dC1hbGlnbjogdmFyKC0tc2VjdGlvbi1oZWFkaW5nLXRleHQtYWxpZ24pO1xuICBwYWRkaW5nOiB2YXIoLS1zZWN0aW9uLWhlYWRpbmctcGFkZGluZyk7XG4gIGZvbnQtc2l6ZTogdmFyKC0tc2VjdGlvbi1oZWFkaW5nLWZvbnQtc2l6ZSk7XG59XG5gLCBcIlwiLHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIndlYnBhY2s6Ly8uL3NyYy9zdHlsZXMvYWJvdXQuY3NzXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJBQUFBO0VBQ0Usa0JBQWtCO0VBQ2xCLGFBQWE7QUFDZjs7QUFFQTtFQUNFLGNBQWM7RUFDZCxXQUFXO0VBQ1gsYUFBYTtBQUNmOztBQUVBO0VBQ0UsZUFBZTtFQUNmLGtCQUFrQjtFQUNsQixvQkFBb0I7RUFDcEIsZUFBZTtFQUNmLFlBQVk7QUFDZDs7QUFFQTtFQUNFLDZDQUE2QztFQUM3Qyx1Q0FBdUM7RUFDdkMsMkNBQTJDO0FBQzdDXCIsXCJzb3VyY2VzQ29udGVudFwiOltcIi5hYm91dF9sZWZ0IHtcXG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcXG4gIGRpc3BsYXk6IGdyaWQ7XFxufVxcblxcbi5hYm91dF9sZWZ0ID4gLmltZ19hYm91dCB7XFxuICBkaXNwbGF5OiBibG9jaztcXG4gIHdpZHRoOiAxMDAlO1xcbiAgcGFkZGluZzogMXJlbTtcXG59XFxuXFxuLmFib3V0X2xlZnQgPiBoMiB7XFxuICBmb250LXNpemU6IDRyZW07XFxuICBwb3NpdGlvbjogYWJzb2x1dGU7XFxuICBqdXN0aWZ5LXNlbGY6IGNlbnRlcjtcXG4gIGFsaWduLXNlbGY6IGVuZDtcXG4gIG1hcmdpbjogMnJlbTtcXG59XFxuXFxuLmFib3V0X3JpZ2h0ID4gaDIge1xcbiAgdGV4dC1hbGlnbjogdmFyKC0tc2VjdGlvbi1oZWFkaW5nLXRleHQtYWxpZ24pO1xcbiAgcGFkZGluZzogdmFyKC0tc2VjdGlvbi1oZWFkaW5nLXBhZGRpbmcpO1xcbiAgZm9udC1zaXplOiB2YXIoLS1zZWN0aW9uLWhlYWRpbmctZm9udC1zaXplKTtcXG59XFxuXCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG4vLyBFeHBvcnRzXG5leHBvcnQgZGVmYXVsdCBfX19DU1NfTE9BREVSX0VYUE9SVF9fXztcbiIsIi8vIEltcG9ydHNcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fIGZyb20gXCIuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvc291cmNlTWFwcy5qc1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2FwaS5qc1wiO1xudmFyIF9fX0NTU19MT0FERVJfRVhQT1JUX19fID0gX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18pO1xuLy8gTW9kdWxlXG5fX19DU1NfTE9BREVSX0VYUE9SVF9fXy5wdXNoKFttb2R1bGUuaWQsIGAuYnRuX21lbnUge1xuICBiYWNrZ3JvdW5kOiBub25lO1xuICBib3JkZXI6IG5vbmU7XG4gIHBhZGRpbmc6IDAuMjVyZW07XG59XG5cbi5idG5fbWVudTpob3ZlciB7XG4gIGN1cnNvcjogcG9pbnRlcjtcbn1cblxuLm1lbnUge1xuICBkaXNwbGF5OiBmbGV4O1xuICBmbGV4LXdyYXA6IHdyYXA7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIHdpZHRoOiAzMnB4O1xuICBoZWlnaHQ6IDMycHg7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbn1cblxuLm1lbnVfbGluZSB7XG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmZmZmY7XG4gIHdpZHRoOiA1MCU7XG4gIGhlaWdodDogNHB4O1xuICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMjUwbXMgZWFzZS1pbjtcbn1cblxuLm1lbnVfbGluZTpudGgtb2YtdHlwZSgzKSB7XG4gIHdpZHRoOiAxMDAlO1xufVxuXG4ubWVudV9saW5lLmFjdGl2ZTpudGgtb2YtdHlwZSgxKSB7XG4gIHRyYW5zZm9ybTogcm90YXRlKDQ1ZGVnKSB0cmFuc2xhdGUoNXB4LCAxcHgpO1xuICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMjUwbXMgZWFzZS1vdXQ7XG59XG5cbi5tZW51X2xpbmUuYWN0aXZlOm50aC1vZi10eXBlKDIpIHtcbiAgdHJhbnNmb3JtOiByb3RhdGUoLTQ1ZGVnKSB0cmFuc2xhdGUoLTVweCwgMXB4KTtcbiAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDI1MG1zIGVhc2Utb3V0O1xufVxuXG4ubWVudV9saW5lLmFjdGl2ZTpudGgtb2YtdHlwZSgzKSB7XG4gIHRyYW5zZm9ybTogcm90YXRlKDE4MGRlZyk7XG4gIG9wYWNpdHk6IDA7XG4gIHZpc2liaWxpdHk6IGhpZGRlbjtcbiAgdHJhbnNpdGlvbjpcbiAgICB0cmFuc2Zvcm0sXG4gICAgb3BhY2l0eSxcbiAgICB2aXNpYmlsaXR5IDUwMG1zIGVhc2Utb3V0O1xufVxuXG4ubWVudV9saW5lLmFjdGl2ZTpudGgtb2YtdHlwZSg0KSB7XG4gIHRyYW5zZm9ybTogcm90YXRlKC00NWRlZykgdHJhbnNsYXRlKDVweCwgLTJweCk7XG4gIHRyYW5zaXRpb246IHRyYW5zZm9ybSAyNTBtcyBlYXNlLW91dDtcbn1cblxuLm1lbnVfbGluZS5hY3RpdmU6bnRoLW9mLXR5cGUoNSkge1xuICB0cmFuc2Zvcm06IHJvdGF0ZSg0NWRlZykgdHJhbnNsYXRlKC01cHgsIC0ycHgpO1xuICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMjUwbXMgZWFzZS1vdXQ7XG59XG5gLCBcIlwiLHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIndlYnBhY2s6Ly8uL3NyYy9zdHlsZXMvYnRuX21lbnUuY3NzXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJBQUFBO0VBQ0UsZ0JBQWdCO0VBQ2hCLFlBQVk7RUFDWixnQkFBZ0I7QUFDbEI7O0FBRUE7RUFDRSxlQUFlO0FBQ2pCOztBQUVBO0VBQ0UsYUFBYTtFQUNiLGVBQWU7RUFDZixtQkFBbUI7RUFDbkIsV0FBVztFQUNYLFlBQVk7RUFDWixrQkFBa0I7QUFDcEI7O0FBRUE7RUFDRSx5QkFBeUI7RUFDekIsVUFBVTtFQUNWLFdBQVc7RUFDWCxtQ0FBbUM7QUFDckM7O0FBRUE7RUFDRSxXQUFXO0FBQ2I7O0FBRUE7RUFDRSw0Q0FBNEM7RUFDNUMsb0NBQW9DO0FBQ3RDOztBQUVBO0VBQ0UsOENBQThDO0VBQzlDLG9DQUFvQztBQUN0Qzs7QUFFQTtFQUNFLHlCQUF5QjtFQUN6QixVQUFVO0VBQ1Ysa0JBQWtCO0VBQ2xCOzs7NkJBRzJCO0FBQzdCOztBQUVBO0VBQ0UsOENBQThDO0VBQzlDLG9DQUFvQztBQUN0Qzs7QUFFQTtFQUNFLDhDQUE4QztFQUM5QyxvQ0FBb0M7QUFDdENcIixcInNvdXJjZXNDb250ZW50XCI6W1wiLmJ0bl9tZW51IHtcXG4gIGJhY2tncm91bmQ6IG5vbmU7XFxuICBib3JkZXI6IG5vbmU7XFxuICBwYWRkaW5nOiAwLjI1cmVtO1xcbn1cXG5cXG4uYnRuX21lbnU6aG92ZXIge1xcbiAgY3Vyc29yOiBwb2ludGVyO1xcbn1cXG5cXG4ubWVudSB7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgZmxleC13cmFwOiB3cmFwO1xcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcXG4gIHdpZHRoOiAzMnB4O1xcbiAgaGVpZ2h0OiAzMnB4O1xcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xcbn1cXG5cXG4ubWVudV9saW5lIHtcXG4gIGJhY2tncm91bmQtY29sb3I6ICNmZmZmZmY7XFxuICB3aWR0aDogNTAlO1xcbiAgaGVpZ2h0OiA0cHg7XFxuICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMjUwbXMgZWFzZS1pbjtcXG59XFxuXFxuLm1lbnVfbGluZTpudGgtb2YtdHlwZSgzKSB7XFxuICB3aWR0aDogMTAwJTtcXG59XFxuXFxuLm1lbnVfbGluZS5hY3RpdmU6bnRoLW9mLXR5cGUoMSkge1xcbiAgdHJhbnNmb3JtOiByb3RhdGUoNDVkZWcpIHRyYW5zbGF0ZSg1cHgsIDFweCk7XFxuICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMjUwbXMgZWFzZS1vdXQ7XFxufVxcblxcbi5tZW51X2xpbmUuYWN0aXZlOm50aC1vZi10eXBlKDIpIHtcXG4gIHRyYW5zZm9ybTogcm90YXRlKC00NWRlZykgdHJhbnNsYXRlKC01cHgsIDFweCk7XFxuICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMjUwbXMgZWFzZS1vdXQ7XFxufVxcblxcbi5tZW51X2xpbmUuYWN0aXZlOm50aC1vZi10eXBlKDMpIHtcXG4gIHRyYW5zZm9ybTogcm90YXRlKDE4MGRlZyk7XFxuICBvcGFjaXR5OiAwO1xcbiAgdmlzaWJpbGl0eTogaGlkZGVuO1xcbiAgdHJhbnNpdGlvbjpcXG4gICAgdHJhbnNmb3JtLFxcbiAgICBvcGFjaXR5LFxcbiAgICB2aXNpYmlsaXR5IDUwMG1zIGVhc2Utb3V0O1xcbn1cXG5cXG4ubWVudV9saW5lLmFjdGl2ZTpudGgtb2YtdHlwZSg0KSB7XFxuICB0cmFuc2Zvcm06IHJvdGF0ZSgtNDVkZWcpIHRyYW5zbGF0ZSg1cHgsIC0ycHgpO1xcbiAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDI1MG1zIGVhc2Utb3V0O1xcbn1cXG5cXG4ubWVudV9saW5lLmFjdGl2ZTpudGgtb2YtdHlwZSg1KSB7XFxuICB0cmFuc2Zvcm06IHJvdGF0ZSg0NWRlZykgdHJhbnNsYXRlKC01cHgsIC0ycHgpO1xcbiAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDI1MG1zIGVhc2Utb3V0O1xcbn1cXG5cIl0sXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcbi8vIEV4cG9ydHNcbmV4cG9ydCBkZWZhdWx0IF9fX0NTU19MT0FERVJfRVhQT1JUX19fO1xuIiwiLy8gSW1wb3J0c1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18gZnJvbSBcIi4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9zb3VyY2VNYXBzLmpzXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fIGZyb20gXCIuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzXCI7XG52YXIgX19fQ1NTX0xPQURFUl9FWFBPUlRfX18gPSBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyk7XG4vLyBNb2R1bGVcbl9fX0NTU19MT0FERVJfRVhQT1JUX19fLnB1c2goW21vZHVsZS5pZCwgYC5jb250YWN0IHtcbiAgYmFja2dyb3VuZC1jb2xvcjogI2ZmZmFmYTtcbn1cblxuLmNvbnRhY3QgPiA6Zmlyc3QtY2hpbGQgPiBoMiB7XG4gIHRleHQtYWxpZ246IHZhcigtLXNlY3Rpb24taGVhZGluZy10ZXh0LWFsaWduKTtcbiAgcGFkZGluZzogdmFyKC0tc2VjdGlvbi1oZWFkaW5nLXBhZGRpbmcpO1xuICBmb250LXNpemU6IHZhcigtLXNlY3Rpb24taGVhZGluZy1mb250LXNpemUpO1xufVxuXG4uY29udGFjdCA+ICogPiBkaXY6bm90KDpmaXJzdC1vZi10eXBlKSB7XG4gIGRpc3BsYXk6IGZsZXg7XG59XG5cbi5jb250YWN0ID4gKiA+IGRpdjpub3QoLmFkZHJlc3MpIHtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAgZ2FwOiAxcmVtO1xufVxuXG4uY29udGFjdCA+ICogPiBkaXY6bm90KDpsYXN0LW9mLXR5cGUpIHtcbiAgbWFyZ2luLWJvdHRvbTogMXJlbTtcbn1cblxuLmNvbnRhY3QgPiAqID4gLmFkZHJlc3Mge1xuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xufVxuXG4uaW1nX2NvbnRhY3Qge1xuICB3aWR0aDogMTAwJTtcbiAgaGVpZ2h0OiBhdXRvO1xufVxuYCwgXCJcIix7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCJ3ZWJwYWNrOi8vLi9zcmMvc3R5bGVzL2NvbnRhY3QuY3NzXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJBQUFBO0VBQ0UseUJBQXlCO0FBQzNCOztBQUVBO0VBQ0UsNkNBQTZDO0VBQzdDLHVDQUF1QztFQUN2QywyQ0FBMkM7QUFDN0M7O0FBRUE7RUFDRSxhQUFhO0FBQ2Y7O0FBRUE7RUFDRSxtQkFBbUI7RUFDbkIsU0FBUztBQUNYOztBQUVBO0VBQ0UsbUJBQW1CO0FBQ3JCOztBQUVBO0VBQ0Usc0JBQXNCO0FBQ3hCOztBQUVBO0VBQ0UsV0FBVztFQUNYLFlBQVk7QUFDZFwiLFwic291cmNlc0NvbnRlbnRcIjpbXCIuY29udGFjdCB7XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmZmYWZhO1xcbn1cXG5cXG4uY29udGFjdCA+IDpmaXJzdC1jaGlsZCA+IGgyIHtcXG4gIHRleHQtYWxpZ246IHZhcigtLXNlY3Rpb24taGVhZGluZy10ZXh0LWFsaWduKTtcXG4gIHBhZGRpbmc6IHZhcigtLXNlY3Rpb24taGVhZGluZy1wYWRkaW5nKTtcXG4gIGZvbnQtc2l6ZTogdmFyKC0tc2VjdGlvbi1oZWFkaW5nLWZvbnQtc2l6ZSk7XFxufVxcblxcbi5jb250YWN0ID4gKiA+IGRpdjpub3QoOmZpcnN0LW9mLXR5cGUpIHtcXG4gIGRpc3BsYXk6IGZsZXg7XFxufVxcblxcbi5jb250YWN0ID4gKiA+IGRpdjpub3QoLmFkZHJlc3MpIHtcXG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XFxuICBnYXA6IDFyZW07XFxufVxcblxcbi5jb250YWN0ID4gKiA+IGRpdjpub3QoOmxhc3Qtb2YtdHlwZSkge1xcbiAgbWFyZ2luLWJvdHRvbTogMXJlbTtcXG59XFxuXFxuLmNvbnRhY3QgPiAqID4gLmFkZHJlc3Mge1xcbiAgZmxleC1kaXJlY3Rpb246IGNvbHVtbjtcXG59XFxuXFxuLmltZ19jb250YWN0IHtcXG4gIHdpZHRoOiAxMDAlO1xcbiAgaGVpZ2h0OiBhdXRvO1xcbn1cXG5cIl0sXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcbi8vIEV4cG9ydHNcbmV4cG9ydCBkZWZhdWx0IF9fX0NTU19MT0FERVJfRVhQT1JUX19fO1xuIiwiLy8gSW1wb3J0c1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18gZnJvbSBcIi4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9zb3VyY2VNYXBzLmpzXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fIGZyb20gXCIuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzXCI7XG52YXIgX19fQ1NTX0xPQURFUl9FWFBPUlRfX18gPSBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyk7XG4vLyBNb2R1bGVcbl9fX0NTU19MT0FERVJfRVhQT1JUX19fLnB1c2goW21vZHVsZS5pZCwgYGZvb3RlciB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBwYWRkaW5nOiAwLjVyZW07XG59XG5gLCBcIlwiLHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIndlYnBhY2s6Ly8uL3NyYy9zdHlsZXMvZm9vdGVyLmNzc1wiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiQUFBQTtFQUNFLGFBQWE7RUFDYix1QkFBdUI7RUFDdkIsZUFBZTtBQUNqQlwiLFwic291cmNlc0NvbnRlbnRcIjpbXCJmb290ZXIge1xcbiAgZGlzcGxheTogZmxleDtcXG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xcbiAgcGFkZGluZzogMC41cmVtO1xcbn1cXG5cIl0sXCJzb3VyY2VSb290XCI6XCJcIn1dKTtcbi8vIEV4cG9ydHNcbmV4cG9ydCBkZWZhdWx0IF9fX0NTU19MT0FERVJfRVhQT1JUX19fO1xuIiwiLy8gSW1wb3J0c1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18gZnJvbSBcIi4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9zb3VyY2VNYXBzLmpzXCI7XG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fIGZyb20gXCIuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvYXBpLmpzXCI7XG52YXIgX19fQ1NTX0xPQURFUl9FWFBPUlRfX18gPSBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18oX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyk7XG4vLyBNb2R1bGVcbl9fX0NTU19MT0FERVJfRVhQT1JUX19fLnB1c2goW21vZHVsZS5pZCwgYCNoZWFkZXJfcHJpbWFyeSB7XG4gIHBvc2l0aW9uOiBzdGlja3k7XG4gIHRvcDogMDtcbiAgcmlnaHQ6IDA7XG4gIHdpZHRoOiAxMDAlO1xuICB6LWluZGV4OiAxO1xufVxuXG5AbWVkaWEgc2NyZWVuIGFuZCAobWluLXdpZHRoOiA3NjhweCkge1xuICAvKiBEZXNrdG9wICovXG59XG5gLCBcIlwiLHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIndlYnBhY2s6Ly8uL3NyYy9zdHlsZXMvaGVhZGVyLmNzc1wiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiQUFBQTtFQUNFLGdCQUFnQjtFQUNoQixNQUFNO0VBQ04sUUFBUTtFQUNSLFdBQVc7RUFDWCxVQUFVO0FBQ1o7O0FBRUE7RUFDRSxZQUFZO0FBQ2RcIixcInNvdXJjZXNDb250ZW50XCI6W1wiI2hlYWRlcl9wcmltYXJ5IHtcXG4gIHBvc2l0aW9uOiBzdGlja3k7XFxuICB0b3A6IDA7XFxuICByaWdodDogMDtcXG4gIHdpZHRoOiAxMDAlO1xcbiAgei1pbmRleDogMTtcXG59XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY4cHgpIHtcXG4gIC8qIERlc2t0b3AgKi9cXG59XFxuXCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG4vLyBFeHBvcnRzXG5leHBvcnQgZGVmYXVsdCBfX19DU1NfTE9BREVSX0VYUE9SVF9fXztcbiIsIi8vIEltcG9ydHNcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fIGZyb20gXCIuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvc291cmNlTWFwcy5qc1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2FwaS5qc1wiO1xudmFyIF9fX0NTU19MT0FERVJfRVhQT1JUX19fID0gX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18pO1xuLy8gTW9kdWxlXG5fX19DU1NfTE9BREVSX0VYUE9SVF9fXy5wdXNoKFttb2R1bGUuaWQsIGBzZWN0aW9uIHtcbiAgcGFkZGluZzogMHJlbSAxcmVtO1xuICBwYWRkaW5nLWJvdHRvbTogMnJlbTtcbn1cblxuYSB7XG4gIHBvc2l0aW9uOiByZWxhdGl2ZTtcbiAgY29sb3I6ICMwMDAwMDA7XG4gIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKDBweCk7XG4gIHRyYW5zaXRpb246IHRyYW5zZm9ybSA1MDBtcyBlYXNlLWluO1xufVxuXG5hOm5vdCg6aGFzKC5sb2dvKSk6OmFmdGVyIHtcbiAgcG9zaXRpb246IGFic29sdXRlO1xuICBjb250ZW50OiAnJztcbiAgd2lkdGg6IDEwMCU7XG4gIGhlaWdodDogMnB4O1xuICBib3R0b206IDA7XG4gIGxlZnQ6IDA7XG4gIGJhY2tncm91bmQtY29sb3I6ICMwMDAwMDA7XG4gIHRyYW5zZm9ybTogc2NhbGVYKDApIHRyYW5zbGF0ZVkoOXB4KTtcbiAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDI1MG1zIGVhc2UtaW47XG59XG5cbmE6aG92ZXIge1xuICBjb2xvcjogI2ZmZmZmZjtcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGVZKC02cHgpO1xuICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gNTAwbXMgY3ViaWMtYmV6aWVyKDAuMzQsIDEuNTYsIDAuNjQsIDEpO1xufVxuXG5hOmhvdmVyOjphZnRlciB7XG4gIHRyYW5zZm9ybTogc2NhbGVYKDEpIHRyYW5zbGF0ZVkoNnB4KTtcbiAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDI1MG1zIGN1YmljLWJlemllcigwLjM0LCAxLjU2LCAwLjY0LCAxKTtcbn1cbmAsIFwiXCIse1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wid2VicGFjazovLy4vc3JjL3N0eWxlcy9tYWluLmNzc1wiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiQUFBQTtFQUNFLGtCQUFrQjtFQUNsQixvQkFBb0I7QUFDdEI7O0FBRUE7RUFDRSxrQkFBa0I7RUFDbEIsY0FBYztFQUNkLHFCQUFxQjtFQUNyQiwwQkFBMEI7RUFDMUIsbUNBQW1DO0FBQ3JDOztBQUVBO0VBQ0Usa0JBQWtCO0VBQ2xCLFdBQVc7RUFDWCxXQUFXO0VBQ1gsV0FBVztFQUNYLFNBQVM7RUFDVCxPQUFPO0VBQ1AseUJBQXlCO0VBQ3pCLG9DQUFvQztFQUNwQyxtQ0FBbUM7QUFDckM7O0FBRUE7RUFDRSxjQUFjO0VBQ2QsMkJBQTJCO0VBQzNCLDZEQUE2RDtBQUMvRDs7QUFFQTtFQUNFLG9DQUFvQztFQUNwQyw2REFBNkQ7QUFDL0RcIixcInNvdXJjZXNDb250ZW50XCI6W1wic2VjdGlvbiB7XFxuICBwYWRkaW5nOiAwcmVtIDFyZW07XFxuICBwYWRkaW5nLWJvdHRvbTogMnJlbTtcXG59XFxuXFxuYSB7XFxuICBwb3NpdGlvbjogcmVsYXRpdmU7XFxuICBjb2xvcjogIzAwMDAwMDtcXG4gIHRleHQtZGVjb3JhdGlvbjogbm9uZTtcXG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgwcHgpO1xcbiAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDUwMG1zIGVhc2UtaW47XFxufVxcblxcbmE6bm90KDpoYXMoLmxvZ28pKTo6YWZ0ZXIge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgY29udGVudDogJyc7XFxuICB3aWR0aDogMTAwJTtcXG4gIGhlaWdodDogMnB4O1xcbiAgYm90dG9tOiAwO1xcbiAgbGVmdDogMDtcXG4gIGJhY2tncm91bmQtY29sb3I6ICMwMDAwMDA7XFxuICB0cmFuc2Zvcm06IHNjYWxlWCgwKSB0cmFuc2xhdGVZKDlweCk7XFxuICB0cmFuc2l0aW9uOiB0cmFuc2Zvcm0gMjUwbXMgZWFzZS1pbjtcXG59XFxuXFxuYTpob3ZlciB7XFxuICBjb2xvcjogI2ZmZmZmZjtcXG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlWSgtNnB4KTtcXG4gIHRyYW5zaXRpb246IHRyYW5zZm9ybSA1MDBtcyBjdWJpYy1iZXppZXIoMC4zNCwgMS41NiwgMC42NCwgMSk7XFxufVxcblxcbmE6aG92ZXI6OmFmdGVyIHtcXG4gIHRyYW5zZm9ybTogc2NhbGVYKDEpIHRyYW5zbGF0ZVkoNnB4KTtcXG4gIHRyYW5zaXRpb246IHRyYW5zZm9ybSAyNTBtcyBjdWJpYy1iZXppZXIoMC4zNCwgMS41NiwgMC42NCwgMSk7XFxufVxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuLy8gRXhwb3J0c1xuZXhwb3J0IGRlZmF1bHQgX19fQ1NTX0xPQURFUl9FWFBPUlRfX187XG4iLCIvLyBJbXBvcnRzXG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL3NvdXJjZU1hcHMuanNcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18gZnJvbSBcIi4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9hcGkuanNcIjtcbnZhciBfX19DU1NfTE9BREVSX0VYUE9SVF9fXyA9IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fKTtcbi8vIE1vZHVsZVxuX19fQ1NTX0xPQURFUl9FWFBPUlRfX18ucHVzaChbbW9kdWxlLmlkLCBgbmF2IHtcbiAgZGlzcGxheTogZmxleDtcbiAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xuICBhbGlnbi1pdGVtczogZW5kO1xuICAvKiBwYWRkaW5nOiAxcmVtIDFyZW0gMHJlbSAxcmVtOyAqL1xuICBwYWRkaW5nOiAxcmVtO1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gIGJhY2tncm91bmQtY29sb3I6IGJpc3F1ZTtcbn1cblxubmF2ID4gKiB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGxpc3Qtc3R5bGU6IG5vbmU7XG59XG5cbi5uYXZfbGVmdCA+ICogPiAqIHtcbiAgZGlzcGxheTogZmxleDtcbiAgYWxpZ24taXRlbXM6IGVuZDtcbn1cblxuLmxvZ28ge1xuICB3aWR0aDogNDhweDtcbiAgaGVpZ2h0OiBhdXRvO1xufVxuXG4uY2lyY2xlIHtcbiAgZGlzcGxheTogbm9uZTtcbn1cblxuLm5hdl9yaWdodCxcbi5uYXZfcmlnaHQuaW5hY3RpdmUge1xuICBkaXNwbGF5OiBmbGV4O1xuICB2aXNpYmlsaXR5OiBoaWRkZW47XG4gIGZsZXgtZGlyZWN0aW9uOiBjb2x1bW47XG4gIGFsaWduLWl0ZW1zOiBlbmQ7XG4gIGdhcDogMXJlbTtcbiAgcG9zaXRpb246IGZpeGVkO1xuICBoZWlnaHQ6IDEwMCU7XG4gIHdpZHRoOiAxMDAlO1xuICB0b3A6IDgwcHg7XG4gIGxlZnQ6IDA7XG4gIHBhZGRpbmc6IDFyZW07XG4gIGJhY2tncm91bmQtY29sb3I6IGxpZ2h0Y29yYWw7XG59XG5cbi5uYXZfcmlnaHQuaW5hY3RpdmUge1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMTAwJSk7XG4gIHRyYW5zaXRpb246XG4gICAgdHJhbnNmb3JtIDI1MG1zLFxuICAgIHZpc2liaWxpdHkgMjUwbXMgZWFzZS1pbjtcbn1cblxuLm5hdl9yaWdodC5hY3RpdmUge1xuICB2aXNpYmlsaXR5OiB2aXNpYmxlO1xuICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMCUpIHBlcnNwZWN0aXZlKCk7XG4gIHRyYW5zaXRpb246IHRyYW5zZm9ybSAyNTBtcyBlYXNlLW91dDtcbn1cblxuLm5hdl9yaWdodCA+IC5uYXZfaXRlbSA+IGEge1xuICBkaXNwbGF5OiBibG9jaztcbn1cblxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY4cHgpIHtcbiAgLyogRGVza3RvcCAqL1xuICAubmF2X3JpZ2h0LFxuICAubmF2X3JpZ2h0LmFjdGl2ZSxcbiAgLm5hdl9yaWdodC5pbmFjdGl2ZSB7XG4gICAgdmlzaWJpbGl0eTogdmlzaWJsZTtcbiAgICBmbGV4LWRpcmVjdGlvbjogcm93O1xuICAgIHBvc2l0aW9uOiBpbml0aWFsO1xuICAgIGJhY2tncm91bmQ6IG5vbmU7XG4gICAgd2lkdGg6IGF1dG87XG4gICAgcGFkZGluZzogMDtcbiAgICB0cmFuc2Zvcm06IHRyYW5zbGF0ZVgoMCk7XG4gIH1cblxuICAuYnRuX3dyYXBwZXIge1xuICAgIGRpc3BsYXk6IG5vbmU7XG4gIH1cbn1cbmAsIFwiXCIse1widmVyc2lvblwiOjMsXCJzb3VyY2VzXCI6W1wid2VicGFjazovLy4vc3JjL3N0eWxlcy9uYXZiYXIuY3NzXCJdLFwibmFtZXNcIjpbXSxcIm1hcHBpbmdzXCI6XCJBQUFBO0VBQ0UsYUFBYTtFQUNiLDhCQUE4QjtFQUM5QixnQkFBZ0I7RUFDaEIsa0NBQWtDO0VBQ2xDLGFBQWE7RUFDYixrQkFBa0I7RUFDbEIsd0JBQXdCO0FBQzFCOztBQUVBO0VBQ0UsYUFBYTtFQUNiLGdCQUFnQjtBQUNsQjs7QUFFQTtFQUNFLGFBQWE7RUFDYixnQkFBZ0I7QUFDbEI7O0FBRUE7RUFDRSxXQUFXO0VBQ1gsWUFBWTtBQUNkOztBQUVBO0VBQ0UsYUFBYTtBQUNmOztBQUVBOztFQUVFLGFBQWE7RUFDYixrQkFBa0I7RUFDbEIsc0JBQXNCO0VBQ3RCLGdCQUFnQjtFQUNoQixTQUFTO0VBQ1QsZUFBZTtFQUNmLFlBQVk7RUFDWixXQUFXO0VBQ1gsU0FBUztFQUNULE9BQU87RUFDUCxhQUFhO0VBQ2IsNEJBQTRCO0FBQzlCOztBQUVBO0VBQ0UsMkJBQTJCO0VBQzNCOzs0QkFFMEI7QUFDNUI7O0FBRUE7RUFDRSxtQkFBbUI7RUFDbkIsdUNBQXVDO0VBQ3ZDLG9DQUFvQztBQUN0Qzs7QUFFQTtFQUNFLGNBQWM7QUFDaEI7O0FBRUE7RUFDRSxZQUFZO0VBQ1o7OztJQUdFLG1CQUFtQjtJQUNuQixtQkFBbUI7SUFDbkIsaUJBQWlCO0lBQ2pCLGdCQUFnQjtJQUNoQixXQUFXO0lBQ1gsVUFBVTtJQUNWLHdCQUF3QjtFQUMxQjs7RUFFQTtJQUNFLGFBQWE7RUFDZjtBQUNGXCIsXCJzb3VyY2VzQ29udGVudFwiOltcIm5hdiB7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAganVzdGlmeS1jb250ZW50OiBzcGFjZS1iZXR3ZWVuO1xcbiAgYWxpZ24taXRlbXM6IGVuZDtcXG4gIC8qIHBhZGRpbmc6IDFyZW0gMXJlbSAwcmVtIDFyZW07ICovXFxuICBwYWRkaW5nOiAxcmVtO1xcbiAgcG9zaXRpb246IHJlbGF0aXZlO1xcbiAgYmFja2dyb3VuZC1jb2xvcjogYmlzcXVlO1xcbn1cXG5cXG5uYXYgPiAqIHtcXG4gIGRpc3BsYXk6IGZsZXg7XFxuICBsaXN0LXN0eWxlOiBub25lO1xcbn1cXG5cXG4ubmF2X2xlZnQgPiAqID4gKiB7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgYWxpZ24taXRlbXM6IGVuZDtcXG59XFxuXFxuLmxvZ28ge1xcbiAgd2lkdGg6IDQ4cHg7XFxuICBoZWlnaHQ6IGF1dG87XFxufVxcblxcbi5jaXJjbGUge1xcbiAgZGlzcGxheTogbm9uZTtcXG59XFxuXFxuLm5hdl9yaWdodCxcXG4ubmF2X3JpZ2h0LmluYWN0aXZlIHtcXG4gIGRpc3BsYXk6IGZsZXg7XFxuICB2aXNpYmlsaXR5OiBoaWRkZW47XFxuICBmbGV4LWRpcmVjdGlvbjogY29sdW1uO1xcbiAgYWxpZ24taXRlbXM6IGVuZDtcXG4gIGdhcDogMXJlbTtcXG4gIHBvc2l0aW9uOiBmaXhlZDtcXG4gIGhlaWdodDogMTAwJTtcXG4gIHdpZHRoOiAxMDAlO1xcbiAgdG9wOiA4MHB4O1xcbiAgbGVmdDogMDtcXG4gIHBhZGRpbmc6IDFyZW07XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiBsaWdodGNvcmFsO1xcbn1cXG5cXG4ubmF2X3JpZ2h0LmluYWN0aXZlIHtcXG4gIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgxMDAlKTtcXG4gIHRyYW5zaXRpb246XFxuICAgIHRyYW5zZm9ybSAyNTBtcyxcXG4gICAgdmlzaWJpbGl0eSAyNTBtcyBlYXNlLWluO1xcbn1cXG5cXG4ubmF2X3JpZ2h0LmFjdGl2ZSB7XFxuICB2aXNpYmlsaXR5OiB2aXNpYmxlO1xcbiAgdHJhbnNmb3JtOiB0cmFuc2xhdGVYKDAlKSBwZXJzcGVjdGl2ZSgpO1xcbiAgdHJhbnNpdGlvbjogdHJhbnNmb3JtIDI1MG1zIGVhc2Utb3V0O1xcbn1cXG5cXG4ubmF2X3JpZ2h0ID4gLm5hdl9pdGVtID4gYSB7XFxuICBkaXNwbGF5OiBibG9jaztcXG59XFxuXFxuQG1lZGlhIHNjcmVlbiBhbmQgKG1pbi13aWR0aDogNzY4cHgpIHtcXG4gIC8qIERlc2t0b3AgKi9cXG4gIC5uYXZfcmlnaHQsXFxuICAubmF2X3JpZ2h0LmFjdGl2ZSxcXG4gIC5uYXZfcmlnaHQuaW5hY3RpdmUge1xcbiAgICB2aXNpYmlsaXR5OiB2aXNpYmxlO1xcbiAgICBmbGV4LWRpcmVjdGlvbjogcm93O1xcbiAgICBwb3NpdGlvbjogaW5pdGlhbDtcXG4gICAgYmFja2dyb3VuZDogbm9uZTtcXG4gICAgd2lkdGg6IGF1dG87XFxuICAgIHBhZGRpbmc6IDA7XFxuICAgIHRyYW5zZm9ybTogdHJhbnNsYXRlWCgwKTtcXG4gIH1cXG5cXG4gIC5idG5fd3JhcHBlciB7XFxuICAgIGRpc3BsYXk6IG5vbmU7XFxuICB9XFxufVxcblwiXSxcInNvdXJjZVJvb3RcIjpcIlwifV0pO1xuLy8gRXhwb3J0c1xuZXhwb3J0IGRlZmF1bHQgX19fQ1NTX0xPQURFUl9FWFBPUlRfX187XG4iLCIvLyBJbXBvcnRzXG5pbXBvcnQgX19fQ1NTX0xPQURFUl9BUElfU09VUkNFTUFQX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL3NvdXJjZU1hcHMuanNcIjtcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9JTVBPUlRfX18gZnJvbSBcIi4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvcnVudGltZS9hcGkuanNcIjtcbnZhciBfX19DU1NfTE9BREVSX0VYUE9SVF9fXyA9IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyhfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fKTtcbi8vIE1vZHVsZVxuX19fQ1NTX0xPQURFUl9FWFBPUlRfX18ucHVzaChbbW9kdWxlLmlkLCBgLnByb2plY3RzID4gaDIge1xuICB0ZXh0LWFsaWduOiB2YXIoLS1zZWN0aW9uLWhlYWRpbmctdGV4dC1hbGlnbik7XG4gIHBhZGRpbmc6IHZhcigtLXNlY3Rpb24taGVhZGluZy1wYWRkaW5nKTtcbiAgZm9udC1zaXplOiB2YXIoLS1zZWN0aW9uLWhlYWRpbmctZm9udC1zaXplKTtcbn1cblxuLnByb2plY3RzID4gLmFydGljbGVzX2NvbnRhaW5lciB7XG4gIGRpc3BsYXk6IGdyaWQ7XG4gIGdhcDogMi41cmVtO1xufVxuXG4ucHJvamVjdHMgPiAuYXJ0aWNsZXNfY29udGFpbmVyID4gYXJ0aWNsZSB7XG4gIGJveC1zaGFkb3c6IDBweCAxcHggNnB4IC0ycHggIzAwMDAwMDtcbn1cblxuYXJ0aWNsZSA+IC5jb250ZW50IHtcbiAgcGFkZGluZzogMXJlbSAyLjVyZW07XG4gIGJhY2tncm91bmQtY29sb3I6IGxpZ2h0c2xhdGVncmF5O1xufVxuXG5hcnRpY2xlID4gLmNvbnRlbnQgPiBwIHtcbiAgbWFyZ2luOiAxcmVtO1xufVxuXG4uYXJ0aWNsZV9oZWFkZXIge1xuICBwb3NpdGlvbjogcmVsYXRpdmU7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGFsaWduLWl0ZW1zOiBjZW50ZXI7XG4gIGdhcDogMC4yNXJlbTtcbiAgcGFkZGluZzogMC4yNXJlbTtcbn1cblxuLmFydGljbGVfaGVhZGVyOjphZnRlciB7XG4gIHBvc2l0aW9uOiBhYnNvbHV0ZTtcbiAgY29udGVudDogJyc7XG4gIHdpZHRoOiAxMDAlO1xuICBoZWlnaHQ6IDJweDtcbiAgYmFja2dyb3VuZC1jb2xvcjogIzAwMDAwMDtcbiAgYm90dG9tOiAtNnB4O1xuICBsZWZ0OiAwO1xufVxuXG4uYXJ0aWNsZV9oZWFkZXIgPiBoMyB7XG4gIGZsZXgtYmFzaXM6IDEwMCU7XG59XG5cbi5hcnRpY2xlX2hlYWRlciA+IGEge1xuICBkaXNwbGF5OiBmbGV4O1xufVxuXG5hcnRpY2xlID4gcGljdHVyZSA+IGltZyB7XG4gIGRpc3BsYXk6IGJsb2NrO1xuICB3aWR0aDogMTAwJTtcbn1cblxuLmljb25fcHJvamVjdCB7XG4gIHdpZHRoOiAyNHB4O1xufVxuYCwgXCJcIix7XCJ2ZXJzaW9uXCI6MyxcInNvdXJjZXNcIjpbXCJ3ZWJwYWNrOi8vLi9zcmMvc3R5bGVzL3Byb2plY3RzLmNzc1wiXSxcIm5hbWVzXCI6W10sXCJtYXBwaW5nc1wiOlwiQUFBQTtFQUNFLDZDQUE2QztFQUM3Qyx1Q0FBdUM7RUFDdkMsMkNBQTJDO0FBQzdDOztBQUVBO0VBQ0UsYUFBYTtFQUNiLFdBQVc7QUFDYjs7QUFFQTtFQUNFLG9DQUFvQztBQUN0Qzs7QUFFQTtFQUNFLG9CQUFvQjtFQUNwQixnQ0FBZ0M7QUFDbEM7O0FBRUE7RUFDRSxZQUFZO0FBQ2Q7O0FBRUE7RUFDRSxrQkFBa0I7RUFDbEIsYUFBYTtFQUNiLG1CQUFtQjtFQUNuQixZQUFZO0VBQ1osZ0JBQWdCO0FBQ2xCOztBQUVBO0VBQ0Usa0JBQWtCO0VBQ2xCLFdBQVc7RUFDWCxXQUFXO0VBQ1gsV0FBVztFQUNYLHlCQUF5QjtFQUN6QixZQUFZO0VBQ1osT0FBTztBQUNUOztBQUVBO0VBQ0UsZ0JBQWdCO0FBQ2xCOztBQUVBO0VBQ0UsYUFBYTtBQUNmOztBQUVBO0VBQ0UsY0FBYztFQUNkLFdBQVc7QUFDYjs7QUFFQTtFQUNFLFdBQVc7QUFDYlwiLFwic291cmNlc0NvbnRlbnRcIjpbXCIucHJvamVjdHMgPiBoMiB7XFxuICB0ZXh0LWFsaWduOiB2YXIoLS1zZWN0aW9uLWhlYWRpbmctdGV4dC1hbGlnbik7XFxuICBwYWRkaW5nOiB2YXIoLS1zZWN0aW9uLWhlYWRpbmctcGFkZGluZyk7XFxuICBmb250LXNpemU6IHZhcigtLXNlY3Rpb24taGVhZGluZy1mb250LXNpemUpO1xcbn1cXG5cXG4ucHJvamVjdHMgPiAuYXJ0aWNsZXNfY29udGFpbmVyIHtcXG4gIGRpc3BsYXk6IGdyaWQ7XFxuICBnYXA6IDIuNXJlbTtcXG59XFxuXFxuLnByb2plY3RzID4gLmFydGljbGVzX2NvbnRhaW5lciA+IGFydGljbGUge1xcbiAgYm94LXNoYWRvdzogMHB4IDFweCA2cHggLTJweCAjMDAwMDAwO1xcbn1cXG5cXG5hcnRpY2xlID4gLmNvbnRlbnQge1xcbiAgcGFkZGluZzogMXJlbSAyLjVyZW07XFxuICBiYWNrZ3JvdW5kLWNvbG9yOiBsaWdodHNsYXRlZ3JheTtcXG59XFxuXFxuYXJ0aWNsZSA+IC5jb250ZW50ID4gcCB7XFxuICBtYXJnaW46IDFyZW07XFxufVxcblxcbi5hcnRpY2xlX2hlYWRlciB7XFxuICBwb3NpdGlvbjogcmVsYXRpdmU7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcXG4gIGdhcDogMC4yNXJlbTtcXG4gIHBhZGRpbmc6IDAuMjVyZW07XFxufVxcblxcbi5hcnRpY2xlX2hlYWRlcjo6YWZ0ZXIge1xcbiAgcG9zaXRpb246IGFic29sdXRlO1xcbiAgY29udGVudDogJyc7XFxuICB3aWR0aDogMTAwJTtcXG4gIGhlaWdodDogMnB4O1xcbiAgYmFja2dyb3VuZC1jb2xvcjogIzAwMDAwMDtcXG4gIGJvdHRvbTogLTZweDtcXG4gIGxlZnQ6IDA7XFxufVxcblxcbi5hcnRpY2xlX2hlYWRlciA+IGgzIHtcXG4gIGZsZXgtYmFzaXM6IDEwMCU7XFxufVxcblxcbi5hcnRpY2xlX2hlYWRlciA+IGEge1xcbiAgZGlzcGxheTogZmxleDtcXG59XFxuXFxuYXJ0aWNsZSA+IHBpY3R1cmUgPiBpbWcge1xcbiAgZGlzcGxheTogYmxvY2s7XFxuICB3aWR0aDogMTAwJTtcXG59XFxuXFxuLmljb25fcHJvamVjdCB7XFxuICB3aWR0aDogMjRweDtcXG59XFxuXCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG4vLyBFeHBvcnRzXG5leHBvcnQgZGVmYXVsdCBfX19DU1NfTE9BREVSX0VYUE9SVF9fXztcbiIsIi8vIEltcG9ydHNcbmltcG9ydCBfX19DU1NfTE9BREVSX0FQSV9TT1VSQ0VNQVBfSU1QT1JUX19fIGZyb20gXCIuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L3J1bnRpbWUvc291cmNlTWFwcy5qc1wiO1xuaW1wb3J0IF9fX0NTU19MT0FERVJfQVBJX0lNUE9SVF9fXyBmcm9tIFwiLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9ydW50aW1lL2FwaS5qc1wiO1xudmFyIF9fX0NTU19MT0FERVJfRVhQT1JUX19fID0gX19fQ1NTX0xPQURFUl9BUElfSU1QT1JUX19fKF9fX0NTU19MT0FERVJfQVBJX1NPVVJDRU1BUF9JTVBPUlRfX18pO1xuLy8gTW9kdWxlXG5fX19DU1NfTE9BREVSX0VYUE9SVF9fXy5wdXNoKFttb2R1bGUuaWQsIGAuc29jaWFscyB7XG4gIGRpc3BsYXk6IGZsZXg7XG4gIGp1c3RpZnktY29udGVudDogY2VudGVyO1xuICBhbGlnbi1pdGVtczogY2VudGVyO1xuICBsaXN0LXN0eWxlOiBub25lO1xuICBnYXA6IDAuNXJlbTtcbiAgbWFyZ2luOiAxcmVtO1xufVxuXG4uc29jaWFscyA+ICogPiAqIHtcbiAgZGlzcGxheTogZmxleDtcbn1cblxuLmljb25fc29jaWFsIHtcbiAgd2lkdGg6IDI0cHg7XG59XG5gLCBcIlwiLHtcInZlcnNpb25cIjozLFwic291cmNlc1wiOltcIndlYnBhY2s6Ly8uL3NyYy9zdHlsZXMvc29jaWFscy5jc3NcIl0sXCJuYW1lc1wiOltdLFwibWFwcGluZ3NcIjpcIkFBQUE7RUFDRSxhQUFhO0VBQ2IsdUJBQXVCO0VBQ3ZCLG1CQUFtQjtFQUNuQixnQkFBZ0I7RUFDaEIsV0FBVztFQUNYLFlBQVk7QUFDZDs7QUFFQTtFQUNFLGFBQWE7QUFDZjs7QUFFQTtFQUNFLFdBQVc7QUFDYlwiLFwic291cmNlc0NvbnRlbnRcIjpbXCIuc29jaWFscyB7XFxuICBkaXNwbGF5OiBmbGV4O1xcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XFxuICBhbGlnbi1pdGVtczogY2VudGVyO1xcbiAgbGlzdC1zdHlsZTogbm9uZTtcXG4gIGdhcDogMC41cmVtO1xcbiAgbWFyZ2luOiAxcmVtO1xcbn1cXG5cXG4uc29jaWFscyA+ICogPiAqIHtcXG4gIGRpc3BsYXk6IGZsZXg7XFxufVxcblxcbi5pY29uX3NvY2lhbCB7XFxuICB3aWR0aDogMjRweDtcXG59XFxuXCJdLFwic291cmNlUm9vdFwiOlwiXCJ9XSk7XG4vLyBFeHBvcnRzXG5leHBvcnQgZGVmYXVsdCBfX19DU1NfTE9BREVSX0VYUE9SVF9fXztcbiIsIlwidXNlIHN0cmljdFwiO1xuXG4vKlxuICBNSVQgTGljZW5zZSBodHRwOi8vd3d3Lm9wZW5zb3VyY2Uub3JnL2xpY2Vuc2VzL21pdC1saWNlbnNlLnBocFxuICBBdXRob3IgVG9iaWFzIEtvcHBlcnMgQHNva3JhXG4qL1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY3NzV2l0aE1hcHBpbmdUb1N0cmluZykge1xuICB2YXIgbGlzdCA9IFtdO1xuXG4gIC8vIHJldHVybiB0aGUgbGlzdCBvZiBtb2R1bGVzIGFzIGNzcyBzdHJpbmdcbiAgbGlzdC50b1N0cmluZyA9IGZ1bmN0aW9uIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiB0aGlzLm1hcChmdW5jdGlvbiAoaXRlbSkge1xuICAgICAgdmFyIGNvbnRlbnQgPSBcIlwiO1xuICAgICAgdmFyIG5lZWRMYXllciA9IHR5cGVvZiBpdGVtWzVdICE9PSBcInVuZGVmaW5lZFwiO1xuICAgICAgaWYgKGl0ZW1bNF0pIHtcbiAgICAgICAgY29udGVudCArPSBcIkBzdXBwb3J0cyAoXCIuY29uY2F0KGl0ZW1bNF0sIFwiKSB7XCIpO1xuICAgICAgfVxuICAgICAgaWYgKGl0ZW1bMl0pIHtcbiAgICAgICAgY29udGVudCArPSBcIkBtZWRpYSBcIi5jb25jYXQoaXRlbVsyXSwgXCIge1wiKTtcbiAgICAgIH1cbiAgICAgIGlmIChuZWVkTGF5ZXIpIHtcbiAgICAgICAgY29udGVudCArPSBcIkBsYXllclwiLmNvbmNhdChpdGVtWzVdLmxlbmd0aCA+IDAgPyBcIiBcIi5jb25jYXQoaXRlbVs1XSkgOiBcIlwiLCBcIiB7XCIpO1xuICAgICAgfVxuICAgICAgY29udGVudCArPSBjc3NXaXRoTWFwcGluZ1RvU3RyaW5nKGl0ZW0pO1xuICAgICAgaWYgKG5lZWRMYXllcikge1xuICAgICAgICBjb250ZW50ICs9IFwifVwiO1xuICAgICAgfVxuICAgICAgaWYgKGl0ZW1bMl0pIHtcbiAgICAgICAgY29udGVudCArPSBcIn1cIjtcbiAgICAgIH1cbiAgICAgIGlmIChpdGVtWzRdKSB7XG4gICAgICAgIGNvbnRlbnQgKz0gXCJ9XCI7XG4gICAgICB9XG4gICAgICByZXR1cm4gY29udGVudDtcbiAgICB9KS5qb2luKFwiXCIpO1xuICB9O1xuXG4gIC8vIGltcG9ydCBhIGxpc3Qgb2YgbW9kdWxlcyBpbnRvIHRoZSBsaXN0XG4gIGxpc3QuaSA9IGZ1bmN0aW9uIGkobW9kdWxlcywgbWVkaWEsIGRlZHVwZSwgc3VwcG9ydHMsIGxheWVyKSB7XG4gICAgaWYgKHR5cGVvZiBtb2R1bGVzID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBtb2R1bGVzID0gW1tudWxsLCBtb2R1bGVzLCB1bmRlZmluZWRdXTtcbiAgICB9XG4gICAgdmFyIGFscmVhZHlJbXBvcnRlZE1vZHVsZXMgPSB7fTtcbiAgICBpZiAoZGVkdXBlKSB7XG4gICAgICBmb3IgKHZhciBrID0gMDsgayA8IHRoaXMubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgdmFyIGlkID0gdGhpc1trXVswXTtcbiAgICAgICAgaWYgKGlkICE9IG51bGwpIHtcbiAgICAgICAgICBhbHJlYWR5SW1wb3J0ZWRNb2R1bGVzW2lkXSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZm9yICh2YXIgX2sgPSAwOyBfayA8IG1vZHVsZXMubGVuZ3RoOyBfaysrKSB7XG4gICAgICB2YXIgaXRlbSA9IFtdLmNvbmNhdChtb2R1bGVzW19rXSk7XG4gICAgICBpZiAoZGVkdXBlICYmIGFscmVhZHlJbXBvcnRlZE1vZHVsZXNbaXRlbVswXV0pIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIGxheWVyICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIGlmICh0eXBlb2YgaXRlbVs1XSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIGl0ZW1bNV0gPSBsYXllcjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpdGVtWzFdID0gXCJAbGF5ZXJcIi5jb25jYXQoaXRlbVs1XS5sZW5ndGggPiAwID8gXCIgXCIuY29uY2F0KGl0ZW1bNV0pIDogXCJcIiwgXCIge1wiKS5jb25jYXQoaXRlbVsxXSwgXCJ9XCIpO1xuICAgICAgICAgIGl0ZW1bNV0gPSBsYXllcjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKG1lZGlhKSB7XG4gICAgICAgIGlmICghaXRlbVsyXSkge1xuICAgICAgICAgIGl0ZW1bMl0gPSBtZWRpYTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpdGVtWzFdID0gXCJAbWVkaWEgXCIuY29uY2F0KGl0ZW1bMl0sIFwiIHtcIikuY29uY2F0KGl0ZW1bMV0sIFwifVwiKTtcbiAgICAgICAgICBpdGVtWzJdID0gbWVkaWE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChzdXBwb3J0cykge1xuICAgICAgICBpZiAoIWl0ZW1bNF0pIHtcbiAgICAgICAgICBpdGVtWzRdID0gXCJcIi5jb25jYXQoc3VwcG9ydHMpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGl0ZW1bMV0gPSBcIkBzdXBwb3J0cyAoXCIuY29uY2F0KGl0ZW1bNF0sIFwiKSB7XCIpLmNvbmNhdChpdGVtWzFdLCBcIn1cIik7XG4gICAgICAgICAgaXRlbVs0XSA9IHN1cHBvcnRzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBsaXN0LnB1c2goaXRlbSk7XG4gICAgfVxuICB9O1xuICByZXR1cm4gbGlzdDtcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKHVybCwgb3B0aW9ucykge1xuICBpZiAoIW9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0ge307XG4gIH1cbiAgaWYgKCF1cmwpIHtcbiAgICByZXR1cm4gdXJsO1xuICB9XG4gIHVybCA9IFN0cmluZyh1cmwuX19lc01vZHVsZSA/IHVybC5kZWZhdWx0IDogdXJsKTtcblxuICAvLyBJZiB1cmwgaXMgYWxyZWFkeSB3cmFwcGVkIGluIHF1b3RlcywgcmVtb3ZlIHRoZW1cbiAgaWYgKC9eWydcIl0uKlsnXCJdJC8udGVzdCh1cmwpKSB7XG4gICAgdXJsID0gdXJsLnNsaWNlKDEsIC0xKTtcbiAgfVxuICBpZiAob3B0aW9ucy5oYXNoKSB7XG4gICAgdXJsICs9IG9wdGlvbnMuaGFzaDtcbiAgfVxuXG4gIC8vIFNob3VsZCB1cmwgYmUgd3JhcHBlZD9cbiAgLy8gU2VlIGh0dHBzOi8vZHJhZnRzLmNzc3dnLm9yZy9jc3MtdmFsdWVzLTMvI3VybHNcbiAgaWYgKC9bXCInKCkgXFx0XFxuXXwoJTIwKS8udGVzdCh1cmwpIHx8IG9wdGlvbnMubmVlZFF1b3Rlcykge1xuICAgIHJldHVybiBcIlxcXCJcIi5jb25jYXQodXJsLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKS5yZXBsYWNlKC9cXG4vZywgXCJcXFxcblwiKSwgXCJcXFwiXCIpO1xuICB9XG4gIHJldHVybiB1cmw7XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gIHZhciBjb250ZW50ID0gaXRlbVsxXTtcbiAgdmFyIGNzc01hcHBpbmcgPSBpdGVtWzNdO1xuICBpZiAoIWNzc01hcHBpbmcpIHtcbiAgICByZXR1cm4gY29udGVudDtcbiAgfVxuICBpZiAodHlwZW9mIGJ0b2EgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHZhciBiYXNlNjQgPSBidG9hKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShjc3NNYXBwaW5nKSkpKTtcbiAgICB2YXIgZGF0YSA9IFwic291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247Y2hhcnNldD11dGYtODtiYXNlNjQsXCIuY29uY2F0KGJhc2U2NCk7XG4gICAgdmFyIHNvdXJjZU1hcHBpbmcgPSBcIi8qIyBcIi5jb25jYXQoZGF0YSwgXCIgKi9cIik7XG4gICAgcmV0dXJuIFtjb250ZW50XS5jb25jYXQoW3NvdXJjZU1hcHBpbmddKS5qb2luKFwiXFxuXCIpO1xuICB9XG4gIHJldHVybiBbY29udGVudF0uam9pbihcIlxcblwiKTtcbn07IiwiXG4gICAgICBpbXBvcnQgQVBJIGZyb20gXCIhLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5qZWN0U3R5bGVzSW50b1N0eWxlVGFnLmpzXCI7XG4gICAgICBpbXBvcnQgZG9tQVBJIGZyb20gXCIhLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvc3R5bGVEb21BUEkuanNcIjtcbiAgICAgIGltcG9ydCBpbnNlcnRGbiBmcm9tIFwiIS4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luc2VydEJ5U2VsZWN0b3IuanNcIjtcbiAgICAgIGltcG9ydCBzZXRBdHRyaWJ1dGVzIGZyb20gXCIhLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvc2V0QXR0cmlidXRlc1dpdGhvdXRBdHRyaWJ1dGVzLmpzXCI7XG4gICAgICBpbXBvcnQgaW5zZXJ0U3R5bGVFbGVtZW50IGZyb20gXCIhLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5zZXJ0U3R5bGVFbGVtZW50LmpzXCI7XG4gICAgICBpbXBvcnQgc3R5bGVUYWdUcmFuc2Zvcm1GbiBmcm9tIFwiIS4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL3N0eWxlVGFnVHJhbnNmb3JtLmpzXCI7XG4gICAgICBpbXBvcnQgY29udGVudCwgKiBhcyBuYW1lZEV4cG9ydCBmcm9tIFwiISEuLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcyEuL2FwcC5jc3NcIjtcbiAgICAgIFxuICAgICAgXG5cbnZhciBvcHRpb25zID0ge307XG5cbm9wdGlvbnMuc3R5bGVUYWdUcmFuc2Zvcm0gPSBzdHlsZVRhZ1RyYW5zZm9ybUZuO1xub3B0aW9ucy5zZXRBdHRyaWJ1dGVzID0gc2V0QXR0cmlidXRlcztcblxuICAgICAgb3B0aW9ucy5pbnNlcnQgPSBpbnNlcnRGbi5iaW5kKG51bGwsIFwiaGVhZFwiKTtcbiAgICBcbm9wdGlvbnMuZG9tQVBJID0gZG9tQVBJO1xub3B0aW9ucy5pbnNlcnRTdHlsZUVsZW1lbnQgPSBpbnNlcnRTdHlsZUVsZW1lbnQ7XG5cbnZhciB1cGRhdGUgPSBBUEkoY29udGVudCwgb3B0aW9ucyk7XG5cblxuXG5leHBvcnQgKiBmcm9tIFwiISEuLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcyEuL2FwcC5jc3NcIjtcbiAgICAgICBleHBvcnQgZGVmYXVsdCBjb250ZW50ICYmIGNvbnRlbnQubG9jYWxzID8gY29udGVudC5sb2NhbHMgOiB1bmRlZmluZWQ7XG4iLCJcbiAgICAgIGltcG9ydCBBUEkgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbmplY3RTdHlsZXNJbnRvU3R5bGVUYWcuanNcIjtcbiAgICAgIGltcG9ydCBkb21BUEkgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zdHlsZURvbUFQSS5qc1wiO1xuICAgICAgaW1wb3J0IGluc2VydEZuIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5zZXJ0QnlTZWxlY3Rvci5qc1wiO1xuICAgICAgaW1wb3J0IHNldEF0dHJpYnV0ZXMgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zZXRBdHRyaWJ1dGVzV2l0aG91dEF0dHJpYnV0ZXMuanNcIjtcbiAgICAgIGltcG9ydCBpbnNlcnRTdHlsZUVsZW1lbnQgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbnNlcnRTdHlsZUVsZW1lbnQuanNcIjtcbiAgICAgIGltcG9ydCBzdHlsZVRhZ1RyYW5zZm9ybUZuIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvc3R5bGVUYWdUcmFuc2Zvcm0uanNcIjtcbiAgICAgIGltcG9ydCBjb250ZW50LCAqIGFzIG5hbWVkRXhwb3J0IGZyb20gXCIhIS4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4vYWJvdXQuY3NzXCI7XG4gICAgICBcbiAgICAgIFxuXG52YXIgb3B0aW9ucyA9IHt9O1xuXG5vcHRpb25zLnN0eWxlVGFnVHJhbnNmb3JtID0gc3R5bGVUYWdUcmFuc2Zvcm1Gbjtcbm9wdGlvbnMuc2V0QXR0cmlidXRlcyA9IHNldEF0dHJpYnV0ZXM7XG5cbiAgICAgIG9wdGlvbnMuaW5zZXJ0ID0gaW5zZXJ0Rm4uYmluZChudWxsLCBcImhlYWRcIik7XG4gICAgXG5vcHRpb25zLmRvbUFQSSA9IGRvbUFQSTtcbm9wdGlvbnMuaW5zZXJ0U3R5bGVFbGVtZW50ID0gaW5zZXJ0U3R5bGVFbGVtZW50O1xuXG52YXIgdXBkYXRlID0gQVBJKGNvbnRlbnQsIG9wdGlvbnMpO1xuXG5cblxuZXhwb3J0ICogZnJvbSBcIiEhLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi9hYm91dC5jc3NcIjtcbiAgICAgICBleHBvcnQgZGVmYXVsdCBjb250ZW50ICYmIGNvbnRlbnQubG9jYWxzID8gY29udGVudC5sb2NhbHMgOiB1bmRlZmluZWQ7XG4iLCJcbiAgICAgIGltcG9ydCBBUEkgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbmplY3RTdHlsZXNJbnRvU3R5bGVUYWcuanNcIjtcbiAgICAgIGltcG9ydCBkb21BUEkgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zdHlsZURvbUFQSS5qc1wiO1xuICAgICAgaW1wb3J0IGluc2VydEZuIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5zZXJ0QnlTZWxlY3Rvci5qc1wiO1xuICAgICAgaW1wb3J0IHNldEF0dHJpYnV0ZXMgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zZXRBdHRyaWJ1dGVzV2l0aG91dEF0dHJpYnV0ZXMuanNcIjtcbiAgICAgIGltcG9ydCBpbnNlcnRTdHlsZUVsZW1lbnQgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbnNlcnRTdHlsZUVsZW1lbnQuanNcIjtcbiAgICAgIGltcG9ydCBzdHlsZVRhZ1RyYW5zZm9ybUZuIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvc3R5bGVUYWdUcmFuc2Zvcm0uanNcIjtcbiAgICAgIGltcG9ydCBjb250ZW50LCAqIGFzIG5hbWVkRXhwb3J0IGZyb20gXCIhIS4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4vYnRuX21lbnUuY3NzXCI7XG4gICAgICBcbiAgICAgIFxuXG52YXIgb3B0aW9ucyA9IHt9O1xuXG5vcHRpb25zLnN0eWxlVGFnVHJhbnNmb3JtID0gc3R5bGVUYWdUcmFuc2Zvcm1Gbjtcbm9wdGlvbnMuc2V0QXR0cmlidXRlcyA9IHNldEF0dHJpYnV0ZXM7XG5cbiAgICAgIG9wdGlvbnMuaW5zZXJ0ID0gaW5zZXJ0Rm4uYmluZChudWxsLCBcImhlYWRcIik7XG4gICAgXG5vcHRpb25zLmRvbUFQSSA9IGRvbUFQSTtcbm9wdGlvbnMuaW5zZXJ0U3R5bGVFbGVtZW50ID0gaW5zZXJ0U3R5bGVFbGVtZW50O1xuXG52YXIgdXBkYXRlID0gQVBJKGNvbnRlbnQsIG9wdGlvbnMpO1xuXG5cblxuZXhwb3J0ICogZnJvbSBcIiEhLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi9idG5fbWVudS5jc3NcIjtcbiAgICAgICBleHBvcnQgZGVmYXVsdCBjb250ZW50ICYmIGNvbnRlbnQubG9jYWxzID8gY29udGVudC5sb2NhbHMgOiB1bmRlZmluZWQ7XG4iLCJcbiAgICAgIGltcG9ydCBBUEkgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbmplY3RTdHlsZXNJbnRvU3R5bGVUYWcuanNcIjtcbiAgICAgIGltcG9ydCBkb21BUEkgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zdHlsZURvbUFQSS5qc1wiO1xuICAgICAgaW1wb3J0IGluc2VydEZuIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5zZXJ0QnlTZWxlY3Rvci5qc1wiO1xuICAgICAgaW1wb3J0IHNldEF0dHJpYnV0ZXMgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zZXRBdHRyaWJ1dGVzV2l0aG91dEF0dHJpYnV0ZXMuanNcIjtcbiAgICAgIGltcG9ydCBpbnNlcnRTdHlsZUVsZW1lbnQgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbnNlcnRTdHlsZUVsZW1lbnQuanNcIjtcbiAgICAgIGltcG9ydCBzdHlsZVRhZ1RyYW5zZm9ybUZuIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvc3R5bGVUYWdUcmFuc2Zvcm0uanNcIjtcbiAgICAgIGltcG9ydCBjb250ZW50LCAqIGFzIG5hbWVkRXhwb3J0IGZyb20gXCIhIS4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4vY29udGFjdC5jc3NcIjtcbiAgICAgIFxuICAgICAgXG5cbnZhciBvcHRpb25zID0ge307XG5cbm9wdGlvbnMuc3R5bGVUYWdUcmFuc2Zvcm0gPSBzdHlsZVRhZ1RyYW5zZm9ybUZuO1xub3B0aW9ucy5zZXRBdHRyaWJ1dGVzID0gc2V0QXR0cmlidXRlcztcblxuICAgICAgb3B0aW9ucy5pbnNlcnQgPSBpbnNlcnRGbi5iaW5kKG51bGwsIFwiaGVhZFwiKTtcbiAgICBcbm9wdGlvbnMuZG9tQVBJID0gZG9tQVBJO1xub3B0aW9ucy5pbnNlcnRTdHlsZUVsZW1lbnQgPSBpbnNlcnRTdHlsZUVsZW1lbnQ7XG5cbnZhciB1cGRhdGUgPSBBUEkoY29udGVudCwgb3B0aW9ucyk7XG5cblxuXG5leHBvcnQgKiBmcm9tIFwiISEuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcyEuL2NvbnRhY3QuY3NzXCI7XG4gICAgICAgZXhwb3J0IGRlZmF1bHQgY29udGVudCAmJiBjb250ZW50LmxvY2FscyA/IGNvbnRlbnQubG9jYWxzIDogdW5kZWZpbmVkO1xuIiwiXG4gICAgICBpbXBvcnQgQVBJIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5qZWN0U3R5bGVzSW50b1N0eWxlVGFnLmpzXCI7XG4gICAgICBpbXBvcnQgZG9tQVBJIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvc3R5bGVEb21BUEkuanNcIjtcbiAgICAgIGltcG9ydCBpbnNlcnRGbiBmcm9tIFwiIS4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luc2VydEJ5U2VsZWN0b3IuanNcIjtcbiAgICAgIGltcG9ydCBzZXRBdHRyaWJ1dGVzIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvc2V0QXR0cmlidXRlc1dpdGhvdXRBdHRyaWJ1dGVzLmpzXCI7XG4gICAgICBpbXBvcnQgaW5zZXJ0U3R5bGVFbGVtZW50IGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5zZXJ0U3R5bGVFbGVtZW50LmpzXCI7XG4gICAgICBpbXBvcnQgc3R5bGVUYWdUcmFuc2Zvcm1GbiBmcm9tIFwiIS4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL3N0eWxlVGFnVHJhbnNmb3JtLmpzXCI7XG4gICAgICBpbXBvcnQgY29udGVudCwgKiBhcyBuYW1lZEV4cG9ydCBmcm9tIFwiISEuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcyEuL2Zvb3Rlci5jc3NcIjtcbiAgICAgIFxuICAgICAgXG5cbnZhciBvcHRpb25zID0ge307XG5cbm9wdGlvbnMuc3R5bGVUYWdUcmFuc2Zvcm0gPSBzdHlsZVRhZ1RyYW5zZm9ybUZuO1xub3B0aW9ucy5zZXRBdHRyaWJ1dGVzID0gc2V0QXR0cmlidXRlcztcblxuICAgICAgb3B0aW9ucy5pbnNlcnQgPSBpbnNlcnRGbi5iaW5kKG51bGwsIFwiaGVhZFwiKTtcbiAgICBcbm9wdGlvbnMuZG9tQVBJID0gZG9tQVBJO1xub3B0aW9ucy5pbnNlcnRTdHlsZUVsZW1lbnQgPSBpbnNlcnRTdHlsZUVsZW1lbnQ7XG5cbnZhciB1cGRhdGUgPSBBUEkoY29udGVudCwgb3B0aW9ucyk7XG5cblxuXG5leHBvcnQgKiBmcm9tIFwiISEuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcyEuL2Zvb3Rlci5jc3NcIjtcbiAgICAgICBleHBvcnQgZGVmYXVsdCBjb250ZW50ICYmIGNvbnRlbnQubG9jYWxzID8gY29udGVudC5sb2NhbHMgOiB1bmRlZmluZWQ7XG4iLCJcbiAgICAgIGltcG9ydCBBUEkgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbmplY3RTdHlsZXNJbnRvU3R5bGVUYWcuanNcIjtcbiAgICAgIGltcG9ydCBkb21BUEkgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zdHlsZURvbUFQSS5qc1wiO1xuICAgICAgaW1wb3J0IGluc2VydEZuIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5zZXJ0QnlTZWxlY3Rvci5qc1wiO1xuICAgICAgaW1wb3J0IHNldEF0dHJpYnV0ZXMgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zZXRBdHRyaWJ1dGVzV2l0aG91dEF0dHJpYnV0ZXMuanNcIjtcbiAgICAgIGltcG9ydCBpbnNlcnRTdHlsZUVsZW1lbnQgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbnNlcnRTdHlsZUVsZW1lbnQuanNcIjtcbiAgICAgIGltcG9ydCBzdHlsZVRhZ1RyYW5zZm9ybUZuIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvc3R5bGVUYWdUcmFuc2Zvcm0uanNcIjtcbiAgICAgIGltcG9ydCBjb250ZW50LCAqIGFzIG5hbWVkRXhwb3J0IGZyb20gXCIhIS4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4vaGVhZGVyLmNzc1wiO1xuICAgICAgXG4gICAgICBcblxudmFyIG9wdGlvbnMgPSB7fTtcblxub3B0aW9ucy5zdHlsZVRhZ1RyYW5zZm9ybSA9IHN0eWxlVGFnVHJhbnNmb3JtRm47XG5vcHRpb25zLnNldEF0dHJpYnV0ZXMgPSBzZXRBdHRyaWJ1dGVzO1xuXG4gICAgICBvcHRpb25zLmluc2VydCA9IGluc2VydEZuLmJpbmQobnVsbCwgXCJoZWFkXCIpO1xuICAgIFxub3B0aW9ucy5kb21BUEkgPSBkb21BUEk7XG5vcHRpb25zLmluc2VydFN0eWxlRWxlbWVudCA9IGluc2VydFN0eWxlRWxlbWVudDtcblxudmFyIHVwZGF0ZSA9IEFQSShjb250ZW50LCBvcHRpb25zKTtcblxuXG5cbmV4cG9ydCAqIGZyb20gXCIhIS4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4vaGVhZGVyLmNzc1wiO1xuICAgICAgIGV4cG9ydCBkZWZhdWx0IGNvbnRlbnQgJiYgY29udGVudC5sb2NhbHMgPyBjb250ZW50LmxvY2FscyA6IHVuZGVmaW5lZDtcbiIsIlxuICAgICAgaW1wb3J0IEFQSSBmcm9tIFwiIS4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qc1wiO1xuICAgICAgaW1wb3J0IGRvbUFQSSBmcm9tIFwiIS4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL3N0eWxlRG9tQVBJLmpzXCI7XG4gICAgICBpbXBvcnQgaW5zZXJ0Rm4gZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbnNlcnRCeVNlbGVjdG9yLmpzXCI7XG4gICAgICBpbXBvcnQgc2V0QXR0cmlidXRlcyBmcm9tIFwiIS4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL3NldEF0dHJpYnV0ZXNXaXRob3V0QXR0cmlidXRlcy5qc1wiO1xuICAgICAgaW1wb3J0IGluc2VydFN0eWxlRWxlbWVudCBmcm9tIFwiIS4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luc2VydFN0eWxlRWxlbWVudC5qc1wiO1xuICAgICAgaW1wb3J0IHN0eWxlVGFnVHJhbnNmb3JtRm4gZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zdHlsZVRhZ1RyYW5zZm9ybS5qc1wiO1xuICAgICAgaW1wb3J0IGNvbnRlbnQsICogYXMgbmFtZWRFeHBvcnQgZnJvbSBcIiEhLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi9tYWluLmNzc1wiO1xuICAgICAgXG4gICAgICBcblxudmFyIG9wdGlvbnMgPSB7fTtcblxub3B0aW9ucy5zdHlsZVRhZ1RyYW5zZm9ybSA9IHN0eWxlVGFnVHJhbnNmb3JtRm47XG5vcHRpb25zLnNldEF0dHJpYnV0ZXMgPSBzZXRBdHRyaWJ1dGVzO1xuXG4gICAgICBvcHRpb25zLmluc2VydCA9IGluc2VydEZuLmJpbmQobnVsbCwgXCJoZWFkXCIpO1xuICAgIFxub3B0aW9ucy5kb21BUEkgPSBkb21BUEk7XG5vcHRpb25zLmluc2VydFN0eWxlRWxlbWVudCA9IGluc2VydFN0eWxlRWxlbWVudDtcblxudmFyIHVwZGF0ZSA9IEFQSShjb250ZW50LCBvcHRpb25zKTtcblxuXG5cbmV4cG9ydCAqIGZyb20gXCIhIS4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4vbWFpbi5jc3NcIjtcbiAgICAgICBleHBvcnQgZGVmYXVsdCBjb250ZW50ICYmIGNvbnRlbnQubG9jYWxzID8gY29udGVudC5sb2NhbHMgOiB1bmRlZmluZWQ7XG4iLCJcbiAgICAgIGltcG9ydCBBUEkgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbmplY3RTdHlsZXNJbnRvU3R5bGVUYWcuanNcIjtcbiAgICAgIGltcG9ydCBkb21BUEkgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zdHlsZURvbUFQSS5qc1wiO1xuICAgICAgaW1wb3J0IGluc2VydEZuIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvaW5zZXJ0QnlTZWxlY3Rvci5qc1wiO1xuICAgICAgaW1wb3J0IHNldEF0dHJpYnV0ZXMgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zZXRBdHRyaWJ1dGVzV2l0aG91dEF0dHJpYnV0ZXMuanNcIjtcbiAgICAgIGltcG9ydCBpbnNlcnRTdHlsZUVsZW1lbnQgZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbnNlcnRTdHlsZUVsZW1lbnQuanNcIjtcbiAgICAgIGltcG9ydCBzdHlsZVRhZ1RyYW5zZm9ybUZuIGZyb20gXCIhLi4vLi4vbm9kZV9tb2R1bGVzL3N0eWxlLWxvYWRlci9kaXN0L3J1bnRpbWUvc3R5bGVUYWdUcmFuc2Zvcm0uanNcIjtcbiAgICAgIGltcG9ydCBjb250ZW50LCAqIGFzIG5hbWVkRXhwb3J0IGZyb20gXCIhIS4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4vbmF2YmFyLmNzc1wiO1xuICAgICAgXG4gICAgICBcblxudmFyIG9wdGlvbnMgPSB7fTtcblxub3B0aW9ucy5zdHlsZVRhZ1RyYW5zZm9ybSA9IHN0eWxlVGFnVHJhbnNmb3JtRm47XG5vcHRpb25zLnNldEF0dHJpYnV0ZXMgPSBzZXRBdHRyaWJ1dGVzO1xuXG4gICAgICBvcHRpb25zLmluc2VydCA9IGluc2VydEZuLmJpbmQobnVsbCwgXCJoZWFkXCIpO1xuICAgIFxub3B0aW9ucy5kb21BUEkgPSBkb21BUEk7XG5vcHRpb25zLmluc2VydFN0eWxlRWxlbWVudCA9IGluc2VydFN0eWxlRWxlbWVudDtcblxudmFyIHVwZGF0ZSA9IEFQSShjb250ZW50LCBvcHRpb25zKTtcblxuXG5cbmV4cG9ydCAqIGZyb20gXCIhIS4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4vbmF2YmFyLmNzc1wiO1xuICAgICAgIGV4cG9ydCBkZWZhdWx0IGNvbnRlbnQgJiYgY29udGVudC5sb2NhbHMgPyBjb250ZW50LmxvY2FscyA6IHVuZGVmaW5lZDtcbiIsIlxuICAgICAgaW1wb3J0IEFQSSBmcm9tIFwiIS4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qc1wiO1xuICAgICAgaW1wb3J0IGRvbUFQSSBmcm9tIFwiIS4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL3N0eWxlRG9tQVBJLmpzXCI7XG4gICAgICBpbXBvcnQgaW5zZXJ0Rm4gZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbnNlcnRCeVNlbGVjdG9yLmpzXCI7XG4gICAgICBpbXBvcnQgc2V0QXR0cmlidXRlcyBmcm9tIFwiIS4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL3NldEF0dHJpYnV0ZXNXaXRob3V0QXR0cmlidXRlcy5qc1wiO1xuICAgICAgaW1wb3J0IGluc2VydFN0eWxlRWxlbWVudCBmcm9tIFwiIS4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luc2VydFN0eWxlRWxlbWVudC5qc1wiO1xuICAgICAgaW1wb3J0IHN0eWxlVGFnVHJhbnNmb3JtRm4gZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zdHlsZVRhZ1RyYW5zZm9ybS5qc1wiO1xuICAgICAgaW1wb3J0IGNvbnRlbnQsICogYXMgbmFtZWRFeHBvcnQgZnJvbSBcIiEhLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi9wcm9qZWN0cy5jc3NcIjtcbiAgICAgIFxuICAgICAgXG5cbnZhciBvcHRpb25zID0ge307XG5cbm9wdGlvbnMuc3R5bGVUYWdUcmFuc2Zvcm0gPSBzdHlsZVRhZ1RyYW5zZm9ybUZuO1xub3B0aW9ucy5zZXRBdHRyaWJ1dGVzID0gc2V0QXR0cmlidXRlcztcblxuICAgICAgb3B0aW9ucy5pbnNlcnQgPSBpbnNlcnRGbi5iaW5kKG51bGwsIFwiaGVhZFwiKTtcbiAgICBcbm9wdGlvbnMuZG9tQVBJID0gZG9tQVBJO1xub3B0aW9ucy5pbnNlcnRTdHlsZUVsZW1lbnQgPSBpbnNlcnRTdHlsZUVsZW1lbnQ7XG5cbnZhciB1cGRhdGUgPSBBUEkoY29udGVudCwgb3B0aW9ucyk7XG5cblxuXG5leHBvcnQgKiBmcm9tIFwiISEuLi8uLi9ub2RlX21vZHVsZXMvY3NzLWxvYWRlci9kaXN0L2Nqcy5qcyEuL3Byb2plY3RzLmNzc1wiO1xuICAgICAgIGV4cG9ydCBkZWZhdWx0IGNvbnRlbnQgJiYgY29udGVudC5sb2NhbHMgPyBjb250ZW50LmxvY2FscyA6IHVuZGVmaW5lZDtcbiIsIlxuICAgICAgaW1wb3J0IEFQSSBmcm9tIFwiIS4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luamVjdFN0eWxlc0ludG9TdHlsZVRhZy5qc1wiO1xuICAgICAgaW1wb3J0IGRvbUFQSSBmcm9tIFwiIS4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL3N0eWxlRG9tQVBJLmpzXCI7XG4gICAgICBpbXBvcnQgaW5zZXJ0Rm4gZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9pbnNlcnRCeVNlbGVjdG9yLmpzXCI7XG4gICAgICBpbXBvcnQgc2V0QXR0cmlidXRlcyBmcm9tIFwiIS4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL3NldEF0dHJpYnV0ZXNXaXRob3V0QXR0cmlidXRlcy5qc1wiO1xuICAgICAgaW1wb3J0IGluc2VydFN0eWxlRWxlbWVudCBmcm9tIFwiIS4uLy4uL25vZGVfbW9kdWxlcy9zdHlsZS1sb2FkZXIvZGlzdC9ydW50aW1lL2luc2VydFN0eWxlRWxlbWVudC5qc1wiO1xuICAgICAgaW1wb3J0IHN0eWxlVGFnVHJhbnNmb3JtRm4gZnJvbSBcIiEuLi8uLi9ub2RlX21vZHVsZXMvc3R5bGUtbG9hZGVyL2Rpc3QvcnVudGltZS9zdHlsZVRhZ1RyYW5zZm9ybS5qc1wiO1xuICAgICAgaW1wb3J0IGNvbnRlbnQsICogYXMgbmFtZWRFeHBvcnQgZnJvbSBcIiEhLi4vLi4vbm9kZV9tb2R1bGVzL2Nzcy1sb2FkZXIvZGlzdC9janMuanMhLi9zb2NpYWxzLmNzc1wiO1xuICAgICAgXG4gICAgICBcblxudmFyIG9wdGlvbnMgPSB7fTtcblxub3B0aW9ucy5zdHlsZVRhZ1RyYW5zZm9ybSA9IHN0eWxlVGFnVHJhbnNmb3JtRm47XG5vcHRpb25zLnNldEF0dHJpYnV0ZXMgPSBzZXRBdHRyaWJ1dGVzO1xuXG4gICAgICBvcHRpb25zLmluc2VydCA9IGluc2VydEZuLmJpbmQobnVsbCwgXCJoZWFkXCIpO1xuICAgIFxub3B0aW9ucy5kb21BUEkgPSBkb21BUEk7XG5vcHRpb25zLmluc2VydFN0eWxlRWxlbWVudCA9IGluc2VydFN0eWxlRWxlbWVudDtcblxudmFyIHVwZGF0ZSA9IEFQSShjb250ZW50LCBvcHRpb25zKTtcblxuXG5cbmV4cG9ydCAqIGZyb20gXCIhIS4uLy4uL25vZGVfbW9kdWxlcy9jc3MtbG9hZGVyL2Rpc3QvY2pzLmpzIS4vc29jaWFscy5jc3NcIjtcbiAgICAgICBleHBvcnQgZGVmYXVsdCBjb250ZW50ICYmIGNvbnRlbnQubG9jYWxzID8gY29udGVudC5sb2NhbHMgOiB1bmRlZmluZWQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcblxudmFyIHN0eWxlc0luRE9NID0gW107XG5mdW5jdGlvbiBnZXRJbmRleEJ5SWRlbnRpZmllcihpZGVudGlmaWVyKSB7XG4gIHZhciByZXN1bHQgPSAtMTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzdHlsZXNJbkRPTS5sZW5ndGg7IGkrKykge1xuICAgIGlmIChzdHlsZXNJbkRPTVtpXS5pZGVudGlmaWVyID09PSBpZGVudGlmaWVyKSB7XG4gICAgICByZXN1bHQgPSBpO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBtb2R1bGVzVG9Eb20obGlzdCwgb3B0aW9ucykge1xuICB2YXIgaWRDb3VudE1hcCA9IHt9O1xuICB2YXIgaWRlbnRpZmllcnMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGl0ZW0gPSBsaXN0W2ldO1xuICAgIHZhciBpZCA9IG9wdGlvbnMuYmFzZSA/IGl0ZW1bMF0gKyBvcHRpb25zLmJhc2UgOiBpdGVtWzBdO1xuICAgIHZhciBjb3VudCA9IGlkQ291bnRNYXBbaWRdIHx8IDA7XG4gICAgdmFyIGlkZW50aWZpZXIgPSBcIlwiLmNvbmNhdChpZCwgXCIgXCIpLmNvbmNhdChjb3VudCk7XG4gICAgaWRDb3VudE1hcFtpZF0gPSBjb3VudCArIDE7XG4gICAgdmFyIGluZGV4QnlJZGVudGlmaWVyID0gZ2V0SW5kZXhCeUlkZW50aWZpZXIoaWRlbnRpZmllcik7XG4gICAgdmFyIG9iaiA9IHtcbiAgICAgIGNzczogaXRlbVsxXSxcbiAgICAgIG1lZGlhOiBpdGVtWzJdLFxuICAgICAgc291cmNlTWFwOiBpdGVtWzNdLFxuICAgICAgc3VwcG9ydHM6IGl0ZW1bNF0sXG4gICAgICBsYXllcjogaXRlbVs1XVxuICAgIH07XG4gICAgaWYgKGluZGV4QnlJZGVudGlmaWVyICE9PSAtMSkge1xuICAgICAgc3R5bGVzSW5ET01baW5kZXhCeUlkZW50aWZpZXJdLnJlZmVyZW5jZXMrKztcbiAgICAgIHN0eWxlc0luRE9NW2luZGV4QnlJZGVudGlmaWVyXS51cGRhdGVyKG9iaik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB1cGRhdGVyID0gYWRkRWxlbWVudFN0eWxlKG9iaiwgb3B0aW9ucyk7XG4gICAgICBvcHRpb25zLmJ5SW5kZXggPSBpO1xuICAgICAgc3R5bGVzSW5ET00uc3BsaWNlKGksIDAsIHtcbiAgICAgICAgaWRlbnRpZmllcjogaWRlbnRpZmllcixcbiAgICAgICAgdXBkYXRlcjogdXBkYXRlcixcbiAgICAgICAgcmVmZXJlbmNlczogMVxuICAgICAgfSk7XG4gICAgfVxuICAgIGlkZW50aWZpZXJzLnB1c2goaWRlbnRpZmllcik7XG4gIH1cbiAgcmV0dXJuIGlkZW50aWZpZXJzO1xufVxuZnVuY3Rpb24gYWRkRWxlbWVudFN0eWxlKG9iaiwgb3B0aW9ucykge1xuICB2YXIgYXBpID0gb3B0aW9ucy5kb21BUEkob3B0aW9ucyk7XG4gIGFwaS51cGRhdGUob2JqKTtcbiAgdmFyIHVwZGF0ZXIgPSBmdW5jdGlvbiB1cGRhdGVyKG5ld09iaikge1xuICAgIGlmIChuZXdPYmopIHtcbiAgICAgIGlmIChuZXdPYmouY3NzID09PSBvYmouY3NzICYmIG5ld09iai5tZWRpYSA9PT0gb2JqLm1lZGlhICYmIG5ld09iai5zb3VyY2VNYXAgPT09IG9iai5zb3VyY2VNYXAgJiYgbmV3T2JqLnN1cHBvcnRzID09PSBvYmouc3VwcG9ydHMgJiYgbmV3T2JqLmxheWVyID09PSBvYmoubGF5ZXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgYXBpLnVwZGF0ZShvYmogPSBuZXdPYmopO1xuICAgIH0gZWxzZSB7XG4gICAgICBhcGkucmVtb3ZlKCk7XG4gICAgfVxuICB9O1xuICByZXR1cm4gdXBkYXRlcjtcbn1cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGxpc3QsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGxpc3QgPSBsaXN0IHx8IFtdO1xuICB2YXIgbGFzdElkZW50aWZpZXJzID0gbW9kdWxlc1RvRG9tKGxpc3QsIG9wdGlvbnMpO1xuICByZXR1cm4gZnVuY3Rpb24gdXBkYXRlKG5ld0xpc3QpIHtcbiAgICBuZXdMaXN0ID0gbmV3TGlzdCB8fCBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxhc3RJZGVudGlmaWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGlkZW50aWZpZXIgPSBsYXN0SWRlbnRpZmllcnNbaV07XG4gICAgICB2YXIgaW5kZXggPSBnZXRJbmRleEJ5SWRlbnRpZmllcihpZGVudGlmaWVyKTtcbiAgICAgIHN0eWxlc0luRE9NW2luZGV4XS5yZWZlcmVuY2VzLS07XG4gICAgfVxuICAgIHZhciBuZXdMYXN0SWRlbnRpZmllcnMgPSBtb2R1bGVzVG9Eb20obmV3TGlzdCwgb3B0aW9ucyk7XG4gICAgZm9yICh2YXIgX2kgPSAwOyBfaSA8IGxhc3RJZGVudGlmaWVycy5sZW5ndGg7IF9pKyspIHtcbiAgICAgIHZhciBfaWRlbnRpZmllciA9IGxhc3RJZGVudGlmaWVyc1tfaV07XG4gICAgICB2YXIgX2luZGV4ID0gZ2V0SW5kZXhCeUlkZW50aWZpZXIoX2lkZW50aWZpZXIpO1xuICAgICAgaWYgKHN0eWxlc0luRE9NW19pbmRleF0ucmVmZXJlbmNlcyA9PT0gMCkge1xuICAgICAgICBzdHlsZXNJbkRPTVtfaW5kZXhdLnVwZGF0ZXIoKTtcbiAgICAgICAgc3R5bGVzSW5ET00uc3BsaWNlKF9pbmRleCwgMSk7XG4gICAgICB9XG4gICAgfVxuICAgIGxhc3RJZGVudGlmaWVycyA9IG5ld0xhc3RJZGVudGlmaWVycztcbiAgfTtcbn07IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbnZhciBtZW1vID0ge307XG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICAqL1xuZnVuY3Rpb24gZ2V0VGFyZ2V0KHRhcmdldCkge1xuICBpZiAodHlwZW9mIG1lbW9bdGFyZ2V0XSA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHZhciBzdHlsZVRhcmdldCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IodGFyZ2V0KTtcblxuICAgIC8vIFNwZWNpYWwgY2FzZSB0byByZXR1cm4gaGVhZCBvZiBpZnJhbWUgaW5zdGVhZCBvZiBpZnJhbWUgaXRzZWxmXG4gICAgaWYgKHdpbmRvdy5IVE1MSUZyYW1lRWxlbWVudCAmJiBzdHlsZVRhcmdldCBpbnN0YW5jZW9mIHdpbmRvdy5IVE1MSUZyYW1lRWxlbWVudCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgLy8gVGhpcyB3aWxsIHRocm93IGFuIGV4Y2VwdGlvbiBpZiBhY2Nlc3MgdG8gaWZyYW1lIGlzIGJsb2NrZWRcbiAgICAgICAgLy8gZHVlIHRvIGNyb3NzLW9yaWdpbiByZXN0cmljdGlvbnNcbiAgICAgICAgc3R5bGVUYXJnZXQgPSBzdHlsZVRhcmdldC5jb250ZW50RG9jdW1lbnQuaGVhZDtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgLy8gaXN0YW5idWwgaWdub3JlIG5leHRcbiAgICAgICAgc3R5bGVUYXJnZXQgPSBudWxsO1xuICAgICAgfVxuICAgIH1cbiAgICBtZW1vW3RhcmdldF0gPSBzdHlsZVRhcmdldDtcbiAgfVxuICByZXR1cm4gbWVtb1t0YXJnZXRdO1xufVxuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAgKi9cbmZ1bmN0aW9uIGluc2VydEJ5U2VsZWN0b3IoaW5zZXJ0LCBzdHlsZSkge1xuICB2YXIgdGFyZ2V0ID0gZ2V0VGFyZ2V0KGluc2VydCk7XG4gIGlmICghdGFyZ2V0KSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGRuJ3QgZmluZCBhIHN0eWxlIHRhcmdldC4gVGhpcyBwcm9iYWJseSBtZWFucyB0aGF0IHRoZSB2YWx1ZSBmb3IgdGhlICdpbnNlcnQnIHBhcmFtZXRlciBpcyBpbnZhbGlkLlwiKTtcbiAgfVxuICB0YXJnZXQuYXBwZW5kQ2hpbGQoc3R5bGUpO1xufVxubW9kdWxlLmV4cG9ydHMgPSBpbnNlcnRCeVNlbGVjdG9yOyIsIlwidXNlIHN0cmljdFwiO1xuXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAgKi9cbmZ1bmN0aW9uIGluc2VydFN0eWxlRWxlbWVudChvcHRpb25zKSB7XG4gIHZhciBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuICBvcHRpb25zLnNldEF0dHJpYnV0ZXMoZWxlbWVudCwgb3B0aW9ucy5hdHRyaWJ1dGVzKTtcbiAgb3B0aW9ucy5pbnNlcnQoZWxlbWVudCwgb3B0aW9ucy5vcHRpb25zKTtcbiAgcmV0dXJuIGVsZW1lbnQ7XG59XG5tb2R1bGUuZXhwb3J0cyA9IGluc2VydFN0eWxlRWxlbWVudDsiLCJcInVzZSBzdHJpY3RcIjtcblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgICovXG5mdW5jdGlvbiBzZXRBdHRyaWJ1dGVzV2l0aG91dEF0dHJpYnV0ZXMoc3R5bGVFbGVtZW50KSB7XG4gIHZhciBub25jZSA9IHR5cGVvZiBfX3dlYnBhY2tfbm9uY2VfXyAhPT0gXCJ1bmRlZmluZWRcIiA/IF9fd2VicGFja19ub25jZV9fIDogbnVsbDtcbiAgaWYgKG5vbmNlKSB7XG4gICAgc3R5bGVFbGVtZW50LnNldEF0dHJpYnV0ZShcIm5vbmNlXCIsIG5vbmNlKTtcbiAgfVxufVxubW9kdWxlLmV4cG9ydHMgPSBzZXRBdHRyaWJ1dGVzV2l0aG91dEF0dHJpYnV0ZXM7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICAqL1xuZnVuY3Rpb24gYXBwbHkoc3R5bGVFbGVtZW50LCBvcHRpb25zLCBvYmopIHtcbiAgdmFyIGNzcyA9IFwiXCI7XG4gIGlmIChvYmouc3VwcG9ydHMpIHtcbiAgICBjc3MgKz0gXCJAc3VwcG9ydHMgKFwiLmNvbmNhdChvYmouc3VwcG9ydHMsIFwiKSB7XCIpO1xuICB9XG4gIGlmIChvYmoubWVkaWEpIHtcbiAgICBjc3MgKz0gXCJAbWVkaWEgXCIuY29uY2F0KG9iai5tZWRpYSwgXCIge1wiKTtcbiAgfVxuICB2YXIgbmVlZExheWVyID0gdHlwZW9mIG9iai5sYXllciAhPT0gXCJ1bmRlZmluZWRcIjtcbiAgaWYgKG5lZWRMYXllcikge1xuICAgIGNzcyArPSBcIkBsYXllclwiLmNvbmNhdChvYmoubGF5ZXIubGVuZ3RoID4gMCA/IFwiIFwiLmNvbmNhdChvYmoubGF5ZXIpIDogXCJcIiwgXCIge1wiKTtcbiAgfVxuICBjc3MgKz0gb2JqLmNzcztcbiAgaWYgKG5lZWRMYXllcikge1xuICAgIGNzcyArPSBcIn1cIjtcbiAgfVxuICBpZiAob2JqLm1lZGlhKSB7XG4gICAgY3NzICs9IFwifVwiO1xuICB9XG4gIGlmIChvYmouc3VwcG9ydHMpIHtcbiAgICBjc3MgKz0gXCJ9XCI7XG4gIH1cbiAgdmFyIHNvdXJjZU1hcCA9IG9iai5zb3VyY2VNYXA7XG4gIGlmIChzb3VyY2VNYXAgJiYgdHlwZW9mIGJ0b2EgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICBjc3MgKz0gXCJcXG4vKiMgc291cmNlTWFwcGluZ1VSTD1kYXRhOmFwcGxpY2F0aW9uL2pzb247YmFzZTY0LFwiLmNvbmNhdChidG9hKHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShzb3VyY2VNYXApKSkpLCBcIiAqL1wiKTtcbiAgfVxuXG4gIC8vIEZvciBvbGQgSUVcbiAgLyogaXN0YW5idWwgaWdub3JlIGlmICAqL1xuICBvcHRpb25zLnN0eWxlVGFnVHJhbnNmb3JtKGNzcywgc3R5bGVFbGVtZW50LCBvcHRpb25zLm9wdGlvbnMpO1xufVxuZnVuY3Rpb24gcmVtb3ZlU3R5bGVFbGVtZW50KHN0eWxlRWxlbWVudCkge1xuICAvLyBpc3RhbmJ1bCBpZ25vcmUgaWZcbiAgaWYgKHN0eWxlRWxlbWVudC5wYXJlbnROb2RlID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHN0eWxlRWxlbWVudC5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKHN0eWxlRWxlbWVudCk7XG59XG5cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICAqL1xuZnVuY3Rpb24gZG9tQVBJKG9wdGlvbnMpIHtcbiAgaWYgKHR5cGVvZiBkb2N1bWVudCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgIHJldHVybiB7XG4gICAgICB1cGRhdGU6IGZ1bmN0aW9uIHVwZGF0ZSgpIHt9LFxuICAgICAgcmVtb3ZlOiBmdW5jdGlvbiByZW1vdmUoKSB7fVxuICAgIH07XG4gIH1cbiAgdmFyIHN0eWxlRWxlbWVudCA9IG9wdGlvbnMuaW5zZXJ0U3R5bGVFbGVtZW50KG9wdGlvbnMpO1xuICByZXR1cm4ge1xuICAgIHVwZGF0ZTogZnVuY3Rpb24gdXBkYXRlKG9iaikge1xuICAgICAgYXBwbHkoc3R5bGVFbGVtZW50LCBvcHRpb25zLCBvYmopO1xuICAgIH0sXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiByZW1vdmUoKSB7XG4gICAgICByZW1vdmVTdHlsZUVsZW1lbnQoc3R5bGVFbGVtZW50KTtcbiAgICB9XG4gIH07XG59XG5tb2R1bGUuZXhwb3J0cyA9IGRvbUFQSTsiLCJcInVzZSBzdHJpY3RcIjtcblxuLyogaXN0YW5idWwgaWdub3JlIG5leHQgICovXG5mdW5jdGlvbiBzdHlsZVRhZ1RyYW5zZm9ybShjc3MsIHN0eWxlRWxlbWVudCkge1xuICBpZiAoc3R5bGVFbGVtZW50LnN0eWxlU2hlZXQpIHtcbiAgICBzdHlsZUVsZW1lbnQuc3R5bGVTaGVldC5jc3NUZXh0ID0gY3NzO1xuICB9IGVsc2Uge1xuICAgIHdoaWxlIChzdHlsZUVsZW1lbnQuZmlyc3RDaGlsZCkge1xuICAgICAgc3R5bGVFbGVtZW50LnJlbW92ZUNoaWxkKHN0eWxlRWxlbWVudC5maXJzdENoaWxkKTtcbiAgICB9XG4gICAgc3R5bGVFbGVtZW50LmFwcGVuZENoaWxkKGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGNzcykpO1xuICB9XG59XG5tb2R1bGUuZXhwb3J0cyA9IHN0eWxlVGFnVHJhbnNmb3JtOyIsImltcG9ydCAnQGljb25mdS9zdmctaW5qZWN0JztcbmltcG9ydCAnLi9hcHAuY3NzJztcbmltcG9ydCBoZWFkZXIgZnJvbSAnLi9jb21wb25lbnRzL2hlYWRlci9oZWFkZXInO1xuaW1wb3J0IG1haW4gZnJvbSAnLi9jb21wb25lbnRzL21haW4vbWFpbic7XG5pbXBvcnQgZm9vdGVyIGZyb20gJy4vY29tcG9uZW50cy9mb290ZXIvZm9vdGVyJztcblxuKCgpID0+IHtcbiAgY29uc3QgYnVpbGQgPSB7XG4gICAgaGVhZGVyOiBoZWFkZXIsXG4gICAgbWFpbjogbWFpbixcbiAgICBmb290ZXI6IGZvb3RlcixcbiAgfTtcblxuICBjb25zdCBhcHAgPSB7XG4gICAgaW5pdCgpIHt9LFxuICAgIGNhY2hlRE9NKCkge30sXG4gICAgYmluZEV2ZW50cygpIHt9LFxuICAgIHJlbmRlcigpIHtcbiAgICAgIC8vIFJlbmRlciBsb2FkaW5nIHNjcmVlbiB3aGlsZSBidWlsZGluZyBhcHAuanNcbiAgICAgIC8vIFJlbW92ZSBsb2FkaW5nIHNjcmVlbiB3aGVuIGJ1aWxkaW5nIGlzIGNvbXBsZXRlXG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGJ1aWxkLmhlYWRlcigpKTtcbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYnVpbGQubWFpbigpKTtcbiAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYnVpbGQuZm9vdGVyKCkpO1xuICAgIH0sXG4gIH07XG5cbiAgYXBwLnJlbmRlcigpO1xufSkoKTtcbiIsImltcG9ydCBzb2NpYWxzIGZyb20gJy4uL3NvY2lhbHMvc29jaWFscyc7XG5pbXBvcnQgYWJvdXRQbGFjZWhvbGRlcl80OTUxeDMzMDEgZnJvbSAnLi4vLi4vYXNzZXRzL2ltYWdlcy9tYXR0aGV3LWhlbnJ5LVU1ck1yU0k3UG40LXVuc3BsYXNoXzQ5NTFfMzMwMS5qcGcnO1xuaW1wb3J0IGFib3V0UGxhY2Vob2xkZXJfMjQwMHgxNjAwIGZyb20gJy4uLy4uL2Fzc2V0cy9pbWFnZXMvbWF0dGhldy1oZW5yeS1VNXJNclNJN1BuNC11bnNwbGFzaF8yNDAwXzE2MDAuanBnJztcbmltcG9ydCBhYm91dFBsYWNlaG9sZGVyXzE5MjB4MTI4MCBmcm9tICcuLi8uLi9hc3NldHMvaW1hZ2VzL21hdHRoZXctaGVucnktVTVyTXJTSTdQbjQtdW5zcGxhc2hfMTkyMF8xMjgwLmpwZyc7XG5pbXBvcnQgYWJvdXRQbGFjZUhvbGRlcl82NDB4NDI3IGZyb20gJy4uLy4uL2Fzc2V0cy9pbWFnZXMvbWF0dGhldy1oZW5yeS1VNXJNclNJN1BuNC11bnNwbGFzaF82NDBfNDI3LmpwZyc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgZWxlbWVudDogJ3NlY3Rpb24nLFxuICBhdHRyaWJ1dGVzOiB7XG4gICAgY2xhc3M6ICdhYm91dCcsXG4gIH0sXG4gIGNoaWxkcmVuOiBbXG4gICAge1xuICAgICAgZWxlbWVudDogJ2RpdicsXG4gICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgIGNsYXNzOiAnYWJvdXRfY29udGFpbmVyJyxcbiAgICAgIH0sXG4gICAgICBjaGlsZHJlbjogW1xuICAgICAgICB7XG4gICAgICAgICAgZWxlbWVudDogJ2RpdicsXG4gICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgY2xhc3M6ICdhYm91dF9sZWZ0JyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGVsZW1lbnQ6ICdpbWcnLFxuICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgY2xhc3M6ICdpbWdfYWJvdXQnLFxuICAgICAgICAgICAgICAgIHNyYzogYWJvdXRQbGFjZWhvbGRlcl80OTUxeDMzMDEsXG4gICAgICAgICAgICAgICAgc3Jjc2V0OiBgJHthYm91dFBsYWNlSG9sZGVyXzY0MHg0Mjd9IDY0MHcsICR7YWJvdXRQbGFjZWhvbGRlcl8xOTIweDEyODB9IDE5MjB3LCAke2Fib3V0UGxhY2Vob2xkZXJfMjQwMHgxNjAwfSAyNDAwdywgJHthYm91dFBsYWNlaG9sZGVyXzQ5NTF4MzMwMX0gNDk1MXdgLFxuICAgICAgICAgICAgICAgIHNpemVzOlxuICAgICAgICAgICAgICAgICAgJyhtYXgtd2lkdGg6IDcwMHB4KSA2NDBweCwgKG1heC13aWR0aDogMTkyMHB4KSAxOTIwcHgsIChtYXgtd2lkdGg6IDI0MDBweCkgMjQwMHB4LCA0OTUxcHgnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBlbGVtZW50OiAnaDInLFxuICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgaWQ6ICdhYm91dCcsXG4gICAgICAgICAgICAgICAgdGV4dENvbnRlbnQ6ICdKb2huIERvZScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBlbGVtZW50OiAnZGl2JyxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICBjbGFzczogJ2Fib3V0X3JpZ2h0JyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGVsZW1lbnQ6ICdoMicsXG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICB0ZXh0Q29udGVudDogJ0Fib3V0IG1lJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGVsZW1lbnQ6ICdwJyxcbiAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgIHRleHRDb250ZW50OlxuICAgICAgICAgICAgICAgICAgJ1BlbGxlbnRlc3F1ZSBjb252YWxsaXMgb3JuYXJlIGxpYmVybyBpZCB2ZWhpY3VsYS4gTWF1cmlzIHF1aXMgbGVvIGEgbmlzbCBwZWxsZW50ZXNxdWUgZnJpbmdpbGxhIHNpdCBhbWV0IGF0IHJpc3VzLiBOdWxsYW0gbWF1cmlzIG9yY2ksIHNvZGFsZXMgZXUgZmVybWVudHVtIHNlZCwgb3JuYXJlIGFjIG5pc2wuIEZ1c2NlIHF1aXMgbGliZXJvIHZ1bHB1dGF0ZSwgcGVsbGVudGVzcXVlIHNhcGllbiBzZWQsIG1hdHRpcyBlbGl0LiBDbGFzcyBhcHRlbnQgdGFjaXRpIHNvY2lvc3F1IGFkIGxpdG9yYSB0b3JxdWVudCBwZXIgY29udWJpYSBub3N0cmEsIHBlciBpbmNlcHRvcyBoaW1lbmFlb3MuJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzb2NpYWxzKCksXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgXSxcbn07XG4iLCJpbXBvcnQgY3JlYXRlRWxlbWVudCBmcm9tICcuLi8uLi9oZWxwZXJzL2NyZWF0ZUVsZW1lbnQnO1xuaW1wb3J0IGFib3V0Q29uZmlnIGZyb20gJy4vYWJvdXQuY29uZmlnJztcbmltcG9ydCAnLi4vLi4vc3R5bGVzL2Fib3V0LmNzcyc7XG5cbmV4cG9ydCBkZWZhdWx0ICgpID0+IHtcbiAgY29uc3QgYWJvdXQgPSB7XG4gICAgaW5pdCgpIHt9LFxuICAgIGNhY2hlRE9NKCkge30sXG4gICAgYmluZEV2ZW50cygpIHt9LFxuICAgIHJlbmRlcigpIHtcbiAgICAgIGNvbnN0IGFib3V0U2VjdGlvbiA9IGNyZWF0ZUVsZW1lbnQoYWJvdXRDb25maWcuZWxlbWVudCwgYWJvdXRDb25maWcuYXR0cmlidXRlcyk7XG4gICAgICBhYm91dFNlY3Rpb24uc2V0Q2hpbGRyZW4oYWJvdXRDb25maWcuY2hpbGRyZW4pO1xuICAgICAgcmV0dXJuIGFib3V0U2VjdGlvbjtcbiAgICB9LFxuICB9O1xuXG4gIHJldHVybiBhYm91dC5yZW5kZXIoKTtcbn07XG4iLCJleHBvcnQgZGVmYXVsdCB7XG4gIGVsZW1lbnQ6ICdidXR0b24nLFxuICBhdHRyaWJ1dGVzOiB7XG4gICAgY2xhc3M6ICdidG5fbWVudScsXG4gICAgWydhcmlhLXByZXNzZWQnXTogZmFsc2UsXG4gIH0sXG4gIGNoaWxkcmVuOiBbXG4gICAge1xuICAgICAgZWxlbWVudDogJ2RpdicsXG4gICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgIGNsYXNzOiAnbWVudScsXG4gICAgICB9LFxuICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgLy8ge1xuICAgICAgICAvLyAgIGVsZW1lbnQ6ICdzcGFuJyxcbiAgICAgICAgLy8gICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgIC8vICAgICBjbGFzczogJ21lbnVfbGluZSBvbmUnLFxuICAgICAgICAvLyAgIH0sXG4gICAgICAgIC8vIH0sXG4gICAgICAgIC8vIHtcbiAgICAgICAgLy8gICBlbGVtZW50OiAnc3BhbicsXG4gICAgICAgIC8vICAgYXR0cmlidXRlczoge1xuICAgICAgICAvLyAgICAgY2xhc3M6ICdtZW51X2xpbmUgdHdvJyxcbiAgICAgICAgLy8gICB9LFxuICAgICAgICAvLyB9LFxuICAgICAgICAvLyB7XG4gICAgICAgIC8vICAgZWxlbWVudDogJ3NwYW4nLFxuICAgICAgICAvLyAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgLy8gICAgIGNsYXNzOiAnbWVudV9saW5lIHRocmVlJyxcbiAgICAgICAgLy8gICB9LFxuICAgICAgICAvLyB9LFxuICAgICAgICB7XG4gICAgICAgICAgZWxlbWVudDogJ3NwYW4nLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIGNsYXNzOiAnbWVudV9saW5lJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZWxlbWVudDogJ3NwYW4nLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIGNsYXNzOiAnbWVudV9saW5lJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZWxlbWVudDogJ3NwYW4nLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIGNsYXNzOiAnbWVudV9saW5lJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZWxlbWVudDogJ3NwYW4nLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIGNsYXNzOiAnbWVudV9saW5lJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZWxlbWVudDogJ3NwYW4nLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIGNsYXNzOiAnbWVudV9saW5lJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICBdLFxufTtcbiIsImltcG9ydCBjcmVhdGVFbGVtZW50IGZyb20gJy4uLy4uLy4uL2hlbHBlcnMvY3JlYXRlRWxlbWVudCc7XG5pbXBvcnQgYnRuX21lbnVDb25maWcgZnJvbSAnLi9idG5fbWVudS5jb25maWcnO1xuaW1wb3J0IHB1YlN1YiBmcm9tICcuLi8uLi8uLi9oZWxwZXJzL3B1YlN1Yic7XG5pbXBvcnQgJy4uLy4uLy4uL3N0eWxlcy9idG5fbWVudS5jc3MnO1xuXG5leHBvcnQgZGVmYXVsdCAoKSA9PiB7XG4gIGNvbnN0IG1lbnVCdXR0b24gPSB7XG4gICAgaW5pdCgpIHtcbiAgICAgIHRoaXMuY2xpY2tIYW5kbGVyID0gdGhpcy5jbGlja0hhbmRsZXIuYmluZCh0aGlzKTtcbiAgICB9LFxuICAgIGNhY2hlRE9NKGVsZW1lbnQpIHtcbiAgICAgIHRoaXMubWVudUJ0biA9IGVsZW1lbnQ7XG4gICAgICB0aGlzLm1lbnVMaW5lcyA9IGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLm1lbnVfbGluZScpO1xuICAgIH0sXG4gICAgYmluZEV2ZW50cygpIHtcbiAgICAgIHRoaXMubWVudUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMuY2xpY2tIYW5kbGVyKTtcbiAgICB9LFxuICAgIHJlbmRlcigpIHtcbiAgICAgIGNvbnN0IHsgZWxlbWVudCwgYXR0cmlidXRlcywgY2hpbGRyZW4gfSA9IGJ0bl9tZW51Q29uZmlnO1xuICAgICAgY29uc3QgYnV0dG9uID0gY3JlYXRlRWxlbWVudChlbGVtZW50LCBhdHRyaWJ1dGVzKTtcbiAgICAgIGJ1dHRvbi5zZXRDaGlsZHJlbihjaGlsZHJlbik7XG5cbiAgICAgIHRoaXMuY2FjaGVET00oYnV0dG9uKTtcbiAgICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgICAgcmV0dXJuIGJ1dHRvbjtcbiAgICB9LFxuICAgIGNsaWNrSGFuZGxlcihlKSB7XG4gICAgICBjb25zb2xlLmxvZyhgY2xpY2tIYW5kbGVyIGZpcmluZyBmcm9tIGJ0bl9tZW51LmpzYCk7XG4gICAgICBjb25zdCBidG4gPSBlLmN1cnJlbnRUYXJnZXQ7XG4gICAgICBjb25zdCBpc1ByZXNzZWQgPSBidG4uYXJpYVByZXNzZWQgPT09ICd0cnVlJztcbiAgICAgIGNvbnN0IHRvZ2dsZSA9IGlzUHJlc3NlZCA/IGZhbHNlIDogdHJ1ZTtcbiAgICAgIGJ0bi5hcmlhUHJlc3NlZCA9IHRvZ2dsZTtcbiAgICAgIFsuLi50aGlzLm1lbnVMaW5lc10uZm9yRWFjaCgobWVudUxpbmUpID0+IHtcbiAgICAgICAgaWYgKHRvZ2dsZSkge1xuICAgICAgICAgIC8vIG1lbnVMaW5lLmNsYXNzTGlzdC5yZW1vdmUoJ2luYWN0aXZlJyk7XG4gICAgICAgICAgbWVudUxpbmUuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gbWVudUxpbmUuY2xhc3NMaXN0LmFkZCgnaW5hY3RpdmUnKTtcbiAgICAgICAgICBtZW51TGluZS5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBwdWJTdWIucHVibGlzaCgndG9nZ2xlTWVudScsIHRvZ2dsZSk7XG4gICAgfSxcbiAgfTtcblxuICBtZW51QnV0dG9uLmluaXQoKTtcbiAgcmV0dXJuIG1lbnVCdXR0b24ucmVuZGVyKCk7XG59O1xuIiwiaW1wb3J0IHBob25lSWNvbiBmcm9tICcuLi8uLi9hc3NldHMvaWNvbnMvcGhvbmVfY2xhc3NpYy5zdmcnO1xuaW1wb3J0IGVtYWlsSWNvbiBmcm9tICcuLi8uLi9hc3NldHMvaWNvbnMvZW1haWwuc3ZnJztcbmltcG9ydCBjb250YWN0U1ZHIGZyb20gJy4uLy4uL2Fzc2V0cy9pY29ucy9wbGFjZWhvbGRlci91bmRyYXdfcGVyc29uYWxfdGV4dF9yZV92cWozLnN2Zyc7XG5pbXBvcnQgc29jaWFscyBmcm9tICcuLi9zb2NpYWxzL3NvY2lhbHMnO1xuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGVsZW1lbnQ6ICdzZWN0aW9uJyxcbiAgYXR0cmlidXRlczoge1xuICAgIGNsYXNzOiAnY29udGFjdCcsXG4gIH0sXG4gIGNoaWxkcmVuOiBbXG4gICAge1xuICAgICAgZWxlbWVudDogJ2RpdicsXG4gICAgICBjaGlsZHJlbjogW1xuICAgICAgICB7XG4gICAgICAgICAgZWxlbWVudDogJ2gyJyxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICBpZDogJ2NvbnRhY3QnLFxuICAgICAgICAgICAgdGV4dENvbnRlbnQ6ICdDb250YWN0IG1lJyxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZWxlbWVudDogJ2RpdicsXG4gICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZWxlbWVudDogJ3AnLFxuICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgdGV4dENvbnRlbnQ6ICdNb3JiaSB0aW5jaWR1bnQgZG9sb3IgYWMgc2FwaWVuIGZhY2lsaXNpcywgbmVjIGxhb3JlZXQgbWkgY29uc2VxdWF0LicsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBlbGVtZW50OiAnZGl2JyxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICBjbGFzczogJ2FkZHJlc3MnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZWxlbWVudDogJ3AnLFxuICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgdGV4dENvbnRlbnQ6ICcxMjM0IFJhbmRvbSBSb2FkJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGVsZW1lbnQ6ICdwJyxcbiAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgIHRleHRDb250ZW50OiAnUmFuZG9tIFRvd24sIFR5cmlhIDEyMzQ1JyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGVsZW1lbnQ6ICdkaXYnLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIGNsYXNzOiAncGhvbmUnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZWxlbWVudDogJ2ltZycsXG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICBjbGFzczogJ2ljb24gaWNvbl9jb250YWN0JyxcbiAgICAgICAgICAgICAgICBzcmM6IHBob25lSWNvbixcbiAgICAgICAgICAgICAgICBvbmxvYWQ6ICdTVkdJbmplY3QodGhpcyknLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZWxlbWVudDogJ3AnLFxuICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgdGV4dENvbnRlbnQ6ICc1NTUtNTU1LTU1NTUnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZWxlbWVudDogJ2RpdicsXG4gICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgY2xhc3M6ICdlbWFpbCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBlbGVtZW50OiAnaW1nJyxcbiAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgIGNsYXNzOiAnaWNvbiBpY29uX2NvbnRhY3QnLFxuICAgICAgICAgICAgICAgIHNyYzogZW1haWxJY29uLFxuICAgICAgICAgICAgICAgIG9ubG9hZDogJ1NWR0luamVjdCh0aGlzKScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBlbGVtZW50OiAncCcsXG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICB0ZXh0Q29udGVudDogJ3BsYWNlaG9sZGVyX2VtYWlsQGdtYWlsLmNvbScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHNvY2lhbHMoKSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICBlbGVtZW50OiAnZGl2JyxcbiAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBlbGVtZW50OiAnaW1nJyxcbiAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICBjbGFzczogJ2ltZ19jb250YWN0JyxcbiAgICAgICAgICAgIHNyYzogY29udGFjdFNWRyxcbiAgICAgICAgICAgIG9ubG9hZDogJ1NWR0luamVjdCh0aGlzKScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgXSxcbn07XG4iLCJpbXBvcnQgY3JlYXRlRWxlbWVudCBmcm9tICcuLi8uLi9oZWxwZXJzL2NyZWF0ZUVsZW1lbnQnO1xuaW1wb3J0IGNvbnRhY3RDb25maWcgZnJvbSAnLi9jb250YWN0LmNvbmZpZyc7XG5pbXBvcnQgJy4uLy4uL3N0eWxlcy9jb250YWN0LmNzcyc7XG5cbmV4cG9ydCBkZWZhdWx0ICgpID0+IHtcbiAgY29uc3QgY29udGFjdCA9IHtcbiAgICBpbml0KCkge30sXG4gICAgY2FjaGVET00oKSB7fSxcbiAgICBiaW5kRXZlbnRzKCkge30sXG4gICAgcmVuZGVyKCkge1xuICAgICAgY29uc3QgY29udGFjdFNlY3Rpb24gPSBjcmVhdGVFbGVtZW50KGNvbnRhY3RDb25maWcuZWxlbWVudCwgY29udGFjdENvbmZpZy5hdHRyaWJ1dGVzKTtcbiAgICAgIGNvbnRhY3RTZWN0aW9uLnNldENoaWxkcmVuKGNvbnRhY3RDb25maWcuY2hpbGRyZW4pO1xuICAgICAgcmV0dXJuIGNvbnRhY3RTZWN0aW9uO1xuICAgIH0sXG4gIH07XG5cbiAgcmV0dXJuIGNvbnRhY3QucmVuZGVyKCk7XG59O1xuIiwiaW1wb3J0IGNyZWF0ZUVsZW1lbnQgZnJvbSAnLi4vLi4vaGVscGVycy9jcmVhdGVFbGVtZW50JztcbmltcG9ydCAnLi4vLi4vc3R5bGVzL2Zvb3Rlci5jc3MnO1xuXG5leHBvcnQgZGVmYXVsdCAoKSA9PiB7XG4gIGNvbnN0IGZvb3RlciA9IHtcbiAgICBpbml0KCkge30sXG4gICAgY2FjaGVET00oKSB7fSxcbiAgICBiaW5kRXZlbnRzKCkge30sXG4gICAgcmVuZGVyKCkge1xuICAgICAgY29uc3QgZm9vdGVyID0gY3JlYXRlRWxlbWVudCgnZm9vdGVyJyk7XG4gICAgICBjb25zdCBmb290ZXJXcmFwcGVyID0gY3JlYXRlRWxlbWVudCgnZGl2JywgeyB0ZXh0Q29udGVudDogJ1BsYWNlaG9sZGVyJyB9KTtcbiAgICAgIGZvb3Rlci5hcHBlbmRDaGlsZChmb290ZXJXcmFwcGVyKTtcbiAgICAgIHJldHVybiBmb290ZXI7XG4gICAgfSxcbiAgfTtcblxuICByZXR1cm4gZm9vdGVyLnJlbmRlcigpO1xufTtcbiIsImltcG9ydCBjcmVhdGVFbGVtZW50IGZyb20gJy4uLy4uL2hlbHBlcnMvY3JlYXRlRWxlbWVudCc7XG5pbXBvcnQgbmF2YmFyIGZyb20gJy4uL25hdmJhci9uYXZiYXInO1xuaW1wb3J0ICcuLi8uLi9zdHlsZXMvaGVhZGVyLmNzcyc7XG5cbmV4cG9ydCBkZWZhdWx0ICgpID0+IHtcbiAgY29uc3QgaGVhZGVyID0ge1xuICAgIGluaXQoKSB7fSxcbiAgICBjYWNoZURPTSgpIHt9LFxuICAgIGJpbmRFdmVudHMoKSB7fSxcbiAgICByZW5kZXIoKSB7XG4gICAgICBjb25zdCBoZWFkZXIgPSBjcmVhdGVFbGVtZW50KCdoZWFkZXInKTtcbiAgICAgIGhlYWRlci5pZCA9ICdoZWFkZXJfcHJpbWFyeSc7XG4gICAgICBoZWFkZXIuYXBwZW5kQ2hpbGQobmF2YmFyKCkpO1xuXG4gICAgICByZXR1cm4gaGVhZGVyO1xuICAgIH0sXG4gIH07XG5cbiAgcmV0dXJuIGhlYWRlci5yZW5kZXIoKTtcbn07XG4iLCJpbXBvcnQgY3JlYXRlRWxlbWVudCBmcm9tICcuLi8uLi9oZWxwZXJzL2NyZWF0ZUVsZW1lbnQnO1xuaW1wb3J0IGFib3V0IGZyb20gJy4uL2Fib3V0L2Fib3V0JztcbmltcG9ydCBwcm9qZWN0cyBmcm9tICcuLi9wcm9qZWN0cy9wcm9qZWN0cyc7XG5pbXBvcnQgY29udGFjdCBmcm9tICcuLi9jb250YWN0L2NvbnRhY3QnO1xuaW1wb3J0ICcuLi8uLi9zdHlsZXMvbWFpbi5jc3MnO1xuXG5leHBvcnQgZGVmYXVsdCAoKSA9PiB7XG4gIGNvbnN0IGJ1aWxkID0ge1xuICAgIGFib3V0OiBhYm91dCxcbiAgICBwcm9qZWN0czogcHJvamVjdHMsXG4gICAgY29udGFjdDogY29udGFjdCxcbiAgfTtcblxuICBjb25zdCBtYWluID0ge1xuICAgIGluaXQoKSB7fSxcbiAgICBjYWNoZURPTSgpIHt9LFxuICAgIGJpbmRFdmVudHMoKSB7fSxcbiAgICByZW5kZXIoKSB7XG4gICAgICBjb25zdCBtYWluID0gY3JlYXRlRWxlbWVudCgnbWFpbicpO1xuICAgICAgbWFpbi5hcHBlbmRDaGlsZChidWlsZC5hYm91dCgpKTtcbiAgICAgIG1haW4uYXBwZW5kQ2hpbGQoYnVpbGQucHJvamVjdHMoKSk7XG4gICAgICBtYWluLmFwcGVuZENoaWxkKGJ1aWxkLmNvbnRhY3QoKSk7XG4gICAgICByZXR1cm4gbWFpbjtcbiAgICB9LFxuICB9O1xuXG4gIHJldHVybiBtYWluLnJlbmRlcigpO1xufTtcbiIsImltcG9ydCBidG5fbWVudSBmcm9tICcuLi9idXR0b25zL21lbnUvYnRuX21lbnUnO1xuaW1wb3J0IGxvZ28gZnJvbSAnLi4vLi4vYXNzZXRzL2ljb25zL3BsYWNlaG9sZGVyL3VuZHJhd19tYWxlX2F2YXRhcl9nOThkLnN2Zyc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgZWxlbWVudDogJ25hdicsXG4gIGNoaWxkcmVuOiBbXG4gICAge1xuICAgICAgZWxlbWVudDogJ3VsJyxcbiAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgY2xhc3M6ICduYXZfbGVmdCcsXG4gICAgICB9LFxuICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAge1xuICAgICAgICAgIGVsZW1lbnQ6ICdsaScsXG4gICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgY2xhc3M6ICduYXZfaXRlbScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBlbGVtZW50OiAnYScsXG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICBocmVmOiAnIycsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ2ltZycsXG4gICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzOiAnbG9nbycsXG4gICAgICAgICAgICAgICAgICAgIHNyYzogbG9nbyxcbiAgICAgICAgICAgICAgICAgICAgb25sb2FkOiAnU1ZHSW5qZWN0KHRoaXMpJyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50OiAnaDEnLFxuICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0Q29udGVudDogJ0pvaG4gRG9lJyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICBlbGVtZW50OiAndWwnLFxuICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICBjbGFzczogJ25hdl9yaWdodCcsXG4gICAgICB9LFxuICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAge1xuICAgICAgICAgIGVsZW1lbnQ6ICdsaScsXG4gICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgY2xhc3M6ICduYXZfaXRlbScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBlbGVtZW50OiAnYScsXG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICBocmVmOiAnI2Fib3V0JyxcbiAgICAgICAgICAgICAgICB0ZXh0Q29udGVudDogJ0Fib3V0JyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGVsZW1lbnQ6ICdsaScsXG4gICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgY2xhc3M6ICduYXZfaXRlbScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBlbGVtZW50OiAnYScsXG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICBocmVmOiAnI3Byb2plY3RzJyxcbiAgICAgICAgICAgICAgICB0ZXh0Q29udGVudDogJ1Byb2plY3RzJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGVsZW1lbnQ6ICdsaScsXG4gICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgY2xhc3M6ICduYXZfaXRlbScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBlbGVtZW50OiAnYScsXG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICBocmVmOiAnI2NvbnRhY3QnLFxuICAgICAgICAgICAgICAgIHRleHRDb250ZW50OiAnQ29udGFjdCcsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgZWxlbWVudDogJ2RpdicsXG4gICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgIGNsYXNzOiAnYnRuX3dyYXBwZXInLFxuICAgICAgfSxcbiAgICAgIGNoaWxkcmVuOiBbYnRuX21lbnUoKV0sXG4gICAgfSxcbiAgXSxcbn07XG4iLCJpbXBvcnQgbmF2YmFyQ29uZmlnIGZyb20gJy4vbmF2YmFyLmNvbmZpZyc7XG5pbXBvcnQgY3JlYXRlRWxlbWVudCBmcm9tICcuLi8uLi9oZWxwZXJzL2NyZWF0ZUVsZW1lbnQnO1xuaW1wb3J0IHB1YlN1YiBmcm9tICcuLi8uLi9oZWxwZXJzL3B1YlN1Yic7XG5pbXBvcnQgJy4uLy4uL3N0eWxlcy9uYXZiYXIuY3NzJztcblxuZXhwb3J0IGRlZmF1bHQgKCkgPT4ge1xuICBjb25zdCBuYXZiYXIgPSB7XG4gICAgaW5pdCgpIHtcbiAgICAgIHRoaXMudG9nZ2xlTWVudSA9IHRoaXMudG9nZ2xlTWVudS5iaW5kKHRoaXMpO1xuICAgIH0sXG4gICAgY2FjaGVET00oZWxlbWVudCkge1xuICAgICAgLy8gdGhpcy5tZW51QnRuID0gZWxlbWVudC5xdWVyeVNlbGVjdG9yKCcuYnRuX21lbnUnKTtcbiAgICAgIHRoaXMubmF2UmlnaHQgPSBlbGVtZW50LnF1ZXJ5U2VsZWN0b3IoJy5uYXZfcmlnaHQnKTtcbiAgICB9LFxuICAgIGJpbmRFdmVudHMoKSB7XG4gICAgICBwdWJTdWIuc3Vic2NyaWJlKCd0b2dnbGVNZW51JywgdGhpcy50b2dnbGVNZW51KTtcbiAgICAgIC8vIHRoaXMubWVudUJ0bi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHRoaXMudG9nZ2xlTWVudSk7XG4gICAgfSxcbiAgICByZW5kZXIoKSB7XG4gICAgICBjb25zdCB7IGVsZW1lbnQsIGNoaWxkcmVuIH0gPSBuYXZiYXJDb25maWc7XG4gICAgICBjb25zdCBuYXYgPSBjcmVhdGVFbGVtZW50KGVsZW1lbnQpO1xuICAgICAgbmF2LnNldENoaWxkcmVuKGNoaWxkcmVuKTtcblxuICAgICAgdGhpcy5jYWNoZURPTShuYXYpO1xuICAgICAgdGhpcy5iaW5kRXZlbnRzKCk7XG4gICAgICByZXR1cm4gbmF2O1xuICAgIH0sXG4gICAgdG9nZ2xlTWVudSh0b2dnbGUpIHtcbiAgICAgIGNvbnNvbGUubG9nKGB0b2dnbGVNZW51IHB1Ymxpc2hlZCBmcm9tIGJ0bl9tZW51LmpzYCk7XG4gICAgICAvLyB0aGlzLm5hdlJpZ2h0LmNsYXNzTGlzdC5hZGQoJycpXG4gICAgICBjb25zb2xlLmxvZyh0b2dnbGUpO1xuICAgICAgdGhpcy5uYXZSaWdodC5jbGFzc0xpc3QucmVtb3ZlKHRvZ2dsZSA/ICdpbmFjdGl2ZScgOiAnYWN0aXZlJyk7XG4gICAgICB0aGlzLm5hdlJpZ2h0LmNsYXNzTGlzdC5hZGQodG9nZ2xlID8gJ2FjdGl2ZScgOiAnaW5hY3RpdmUnKTtcbiAgICB9LFxuICB9O1xuXG4gIG5hdmJhci5pbml0KCk7XG4gIHJldHVybiBuYXZiYXIucmVuZGVyKCk7XG59O1xuIiwiaW1wb3J0IGdpdEh1Ykljb24gZnJvbSAnLi4vLi4vYXNzZXRzL2ljb25zL2dpdGh1Yl9tYXJrL2dpdGh1Yi1tYXJrLXdoaXRlLnN2Zyc7XG5pbXBvcnQgb3BlbkluTmV3SWNvbiBmcm9tICcuLi8uLi9hc3NldHMvaWNvbnMvb3Blbl9pbl9uZXcuc3ZnJztcblxuZXhwb3J0IGRlZmF1bHQge1xuICBlbGVtZW50OiAnc2VjdGlvbicsXG4gIGF0dHJpYnV0ZXM6IHtcbiAgICBjbGFzczogJ3Byb2plY3RzJyxcbiAgfSxcbiAgY2hpbGRyZW46IFtcbiAgICB7XG4gICAgICBlbGVtZW50OiAnaDInLFxuICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICBpZDogJ3Byb2plY3RzJyxcbiAgICAgICAgdGV4dENvbnRlbnQ6ICdQcm9qZWN0cycsXG4gICAgICB9LFxuICAgIH0sXG4gICAge1xuICAgICAgZWxlbWVudDogJ2RpdicsXG4gICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgIGNsYXNzOiAnYXJ0aWNsZXNfY29udGFpbmVyJyxcbiAgICAgIH0sXG4gICAgICBjaGlsZHJlbjogW1xuICAgICAgICB7XG4gICAgICAgICAgZWxlbWVudDogJ2FydGljbGUnLFxuICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGVsZW1lbnQ6ICdwaWN0dXJlJyxcbiAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50OiAnaW1nJyxcbiAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9wbGFjZWhvbGQuY28vNjAweDQwMCcsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBlbGVtZW50OiAnZGl2JyxcbiAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgIGNsYXNzOiAnY29udGVudCcsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ2hlYWRlcicsXG4gICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzOiAnYXJ0aWNsZV9oZWFkZXInLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiAnaDMnLFxuICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHRDb250ZW50OiAnUHJvamVjdDAwJyxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ2EnLFxuICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY6ICcjJyxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdpbWcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICdpY29uIGljb25fcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiBnaXRIdWJJY29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ubG9hZDogJ1NWR0luamVjdCh0aGlzKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiAnYScsXG4gICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaHJlZjogJyMnLFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ2ltZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzczogJ2ljb24gaWNvbl9wcm9qZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmM6IG9wZW5Jbk5ld0ljb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25sb2FkOiAnU1ZHSW5qZWN0KHRoaXMpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50OiAncCcsXG4gICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIHRleHRDb250ZW50OlxuICAgICAgICAgICAgICAgICAgICAgICdNYWVjZW5hcyBmZXJtZW50dW0gcHVydXMgZGlhbSwgYSBncmF2aWRhIG51bmMgbWF0dGlzIGFjLiBOdWxsYSB2b2x1dHBhdCBsZWN0dXMgb2RpbywgaW4gY29uc2VjdGV0dXIgZmVsaXMgdWx0cmljaWVzIGlkLiBOdWxsYSBleCBqdXN0bywgc29sbGljaXR1ZGluIGFjIGZhdWNpYnVzIGV1LCBwb3J0dGl0b3IgbmVjIHRvcnRvci4gTnVuYyBzaXQgYW1ldCBzYXBpZW4gZXguJyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGVsZW1lbnQ6ICdhcnRpY2xlJyxcbiAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBlbGVtZW50OiAncGljdHVyZScsXG4gICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ2ltZycsXG4gICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vcGxhY2Vob2xkLmNvLzYwMHg0MDAnLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZWxlbWVudDogJ2RpdicsXG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICBjbGFzczogJ2NvbnRlbnQnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdoZWFkZXInLFxuICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICBjbGFzczogJ2FydGljbGVfaGVhZGVyJyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ2gzJyxcbiAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0Q29udGVudDogJ1Byb2plY3QwMScsXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdhJyxcbiAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBocmVmOiAnIycsXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiAnaW1nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiAnaWNvbiBpY29uX3Byb2plY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogZ2l0SHViSWNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmxvYWQ6ICdTVkdJbmplY3QodGhpcyknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ2EnLFxuICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY6ICcjJyxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdpbWcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICdpY29uIGljb25fcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiBvcGVuSW5OZXdJY29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ubG9hZDogJ1NWR0luamVjdCh0aGlzKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ3AnLFxuICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0Q29udGVudDpcbiAgICAgICAgICAgICAgICAgICAgICAnTnVsbGEgc2NlbGVyaXNxdWUgZmVsaXMgdmVsIG5pYmggc2FnaXR0aXMgc29sbGljaXR1ZGluLiBNb3JiaSB1cm5hIGxhY3VzLCB1bGxhbWNvcnBlciBldCBhbGlxdWV0IGV0LCBtb2xsaXMgdmVzdGlidWx1bSBlbGl0LiBTZWQgdml0YWUgb3JuYXJlIGxlY3R1cy4gTmFtIHF1aXMgbWF0dGlzIG1ldHVzLicsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBlbGVtZW50OiAnYXJ0aWNsZScsXG4gICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZWxlbWVudDogJ3BpY3R1cmUnLFxuICAgICAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdpbWcnLFxuICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICBzcmM6ICdodHRwczovL3BsYWNlaG9sZC5jby82MDB4NDAwJyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGVsZW1lbnQ6ICdkaXYnLFxuICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgY2xhc3M6ICdjb250ZW50JyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50OiAnaGVhZGVyJyxcbiAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICdhcnRpY2xlX2hlYWRlcicsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdoMycsXG4gICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dENvbnRlbnQ6ICdQcm9qZWN0MDInLFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiAnYScsXG4gICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaHJlZjogJyMnLFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ2ltZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzczogJ2ljb24gaWNvbl9wcm9qZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmM6IGdpdEh1Ykljb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25sb2FkOiAnU1ZHSW5qZWN0KHRoaXMpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdhJyxcbiAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBocmVmOiAnIycsXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiAnaW1nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiAnaWNvbiBpY29uX3Byb2plY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogb3BlbkluTmV3SWNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmxvYWQ6ICdTVkdJbmplY3QodGhpcyknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdwJyxcbiAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dENvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICAgICAgJ0RvbmVjIGFjIHVsbGFtY29ycGVyIG9kaW8sIHRyaXN0aXF1ZSBsYW9yZWV0IHRlbGx1cy4gTnVsbGEgdGVtcG9yIGVuaW0gbG9yZW0sIGFjIGlhY3VsaXMgdXJuYSBwdWx2aW5hciBub24uIFV0IGZpbmlidXMgbmlzaSBtYXVyaXMuIEludGVnZXIgZGlnbmlzc2ltIG5pc2kgbmVjIHNhcGllbiBjdXJzdXMgcG9zdWVyZS4gVXQgZXQgaXBzdW0gbmlzaS4gSW4gdmVsIGVsaXQgbnVsbGEuJyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGVsZW1lbnQ6ICdhcnRpY2xlJyxcbiAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBlbGVtZW50OiAncGljdHVyZScsXG4gICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ2ltZycsXG4gICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vcGxhY2Vob2xkLmNvLzYwMHg0MDAnLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZWxlbWVudDogJ2RpdicsXG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICBjbGFzczogJ2NvbnRlbnQnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdoZWFkZXInLFxuICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICBjbGFzczogJ2FydGljbGVfaGVhZGVyJyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ2gzJyxcbiAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0Q29udGVudDogJ1Byb2plY3QwMycsXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdhJyxcbiAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBocmVmOiAnIycsXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiAnaW1nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiAnaWNvbiBpY29uX3Byb2plY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogZ2l0SHViSWNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmxvYWQ6ICdTVkdJbmplY3QodGhpcyknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ2EnLFxuICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY6ICcjJyxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdpbWcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICdpY29uIGljb25fcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiBvcGVuSW5OZXdJY29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ubG9hZDogJ1NWR0luamVjdCh0aGlzKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ3AnLFxuICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICB0ZXh0Q29udGVudDpcbiAgICAgICAgICAgICAgICAgICAgICAnU3VzcGVuZGlzc2Ugb3JuYXJlIHJob25jdXMgdGluY2lkdW50LiBTdXNwZW5kaXNzZSB2dWxwdXRhdGUgYWxpcXVhbSBlcm9zIGluIGJsYW5kaXQuIFBlbGxlbnRlc3F1ZSBzZWQgdGVtcG9yIGRvbG9yLiBEb25lYyBlbGVpZmVuZCwgYXVndWUgc2l0IGFtZXQgdGluY2lkdW50IG9ybmFyZSwgbGFjdXMgbG9yZW0gbWFsZXN1YWRhIG1ldHVzLCBuZWMgc3VzY2lwaXQgZG9sb3IgdG9ydG9yIG5vbiBlcm9zLicsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBlbGVtZW50OiAnYXJ0aWNsZScsXG4gICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZWxlbWVudDogJ3BpY3R1cmUnLFxuICAgICAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdpbWcnLFxuICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICBzcmM6ICdodHRwczovL3BsYWNlaG9sZC5jby82MDB4NDAwJyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGVsZW1lbnQ6ICdkaXYnLFxuICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgY2xhc3M6ICdjb250ZW50JyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50OiAnaGVhZGVyJyxcbiAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICdhcnRpY2xlX2hlYWRlcicsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdoMycsXG4gICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dENvbnRlbnQ6ICdQcm9qZWN0MDQnLFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiAnYScsXG4gICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaHJlZjogJyMnLFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ2ltZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzczogJ2ljb24gaWNvbl9wcm9qZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmM6IGdpdEh1Ykljb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25sb2FkOiAnU1ZHSW5qZWN0KHRoaXMpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdhJyxcbiAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBocmVmOiAnIycsXG4gICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICBjaGlsZHJlbjogW1xuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiAnaW1nJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzOiAnaWNvbiBpY29uX3Byb2plY3QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogb3BlbkluTmV3SWNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbmxvYWQ6ICdTVkdJbmplY3QodGhpcyknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdwJyxcbiAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgdGV4dENvbnRlbnQ6XG4gICAgICAgICAgICAgICAgICAgICAgJ0ludGVyZHVtIGV0IG1hbGVzdWFkYSBmYW1lcyBhYyBhbnRlIGlwc3VtIHByaW1pcyBpbiBmYXVjaWJ1cy4gQ3VyYWJpdHVyIGZhdWNpYnVzIG1hZ25hIHF1aXMgbWFnbmEgYmxhbmRpdCwgc2VkIHVsdHJpY2llcyBmZWxpcyBvcm5hcmUuIE1hZWNlbmFzIHZlc3RpYnVsdW0gYWMgbWFnbmEgbmVjIGZlcm1lbnR1bS4nLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgZWxlbWVudDogJ2FydGljbGUnLFxuICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGVsZW1lbnQ6ICdwaWN0dXJlJyxcbiAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50OiAnaW1nJyxcbiAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9wbGFjZWhvbGQuY28vNjAweDQwMCcsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBlbGVtZW50OiAnZGl2JyxcbiAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgIGNsYXNzOiAnY29udGVudCcsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ2hlYWRlcicsXG4gICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIGNsYXNzOiAnYXJ0aWNsZV9oZWFkZXInLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiAnaDMnLFxuICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHRDb250ZW50OiAnUHJvamVjdDA1JyxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ2EnLFxuICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGhyZWY6ICcjJyxcbiAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQ6ICdpbWcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3M6ICdpY29uIGljb25fcHJvamVjdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3JjOiBnaXRIdWJJY29uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9ubG9hZDogJ1NWR0luamVjdCh0aGlzKScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50OiAnYScsXG4gICAgICAgICAgICAgICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgICAgICAgICAgICAgaHJlZjogJyMnLFxuICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudDogJ2ltZycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzczogJ2ljb24gaWNvbl9wcm9qZWN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzcmM6IG9wZW5Jbk5ld0ljb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25sb2FkOiAnU1ZHSW5qZWN0KHRoaXMpJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBlbGVtZW50OiAncCcsXG4gICAgICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgICAgIHRleHRDb250ZW50OlxuICAgICAgICAgICAgICAgICAgICAgICdTdXNwZW5kaXNzZSBjb21tb2RvIHBoYXJldHJhIHNlbSwgZXVpc21vZCBzdXNjaXBpdCB2ZWxpdCBjb25kaW1lbnR1bSBpbi4gSW50ZWdlciBydXRydW0gbWFsZXN1YWRhIG9yY2ksIGlkIGV1aXNtb2QgYXVndWUgdWx0cmljZXMgc2VkLiBOdWxsYSBldSBlbmltIHVsdHJpY2llcywgdGluY2lkdW50IGxvcmVtIGF0LCBlZmZpY2l0dXIgZXguIEFlbmVhbiB0ZW1wdXMgcmlzdXMgYWMgcHVydXMgYWxpcXVldCBmaW5pYnVzLicsXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gIF0sXG59O1xuIiwiaW1wb3J0IGNyZWF0ZUVsZW1lbnQgZnJvbSAnLi4vLi4vaGVscGVycy9jcmVhdGVFbGVtZW50JztcbmltcG9ydCBwcm9qZWN0c0NvbmZpZyBmcm9tICcuL3Byb2plY3RzLmNvbmZpZyc7XG5pbXBvcnQgJy4uLy4uL3N0eWxlcy9wcm9qZWN0cy5jc3MnO1xuXG5leHBvcnQgZGVmYXVsdCAoKSA9PiB7XG4gIGNvbnN0IHByb2plY3RzID0ge1xuICAgIGluaXQoKSB7fSxcbiAgICBjYWNoZURPTSgpIHt9LFxuICAgIGJpbmRFdmVudHMoKSB7fSxcbiAgICByZW5kZXIoKSB7XG4gICAgICBjb25zdCBwcm9qZWN0c1NlY3Rpb24gPSBjcmVhdGVFbGVtZW50KHByb2plY3RzQ29uZmlnLmVsZW1lbnQsIHByb2plY3RzQ29uZmlnLmF0dHJpYnV0ZXMpO1xuICAgICAgcHJvamVjdHNTZWN0aW9uLnNldENoaWxkcmVuKHByb2plY3RzQ29uZmlnLmNoaWxkcmVuKTtcbiAgICAgIHJldHVybiBwcm9qZWN0c1NlY3Rpb247XG4gICAgfSxcbiAgfTtcblxuICByZXR1cm4gcHJvamVjdHMucmVuZGVyKCk7XG59O1xuIiwiaW1wb3J0IGdpdEh1Ykljb24gZnJvbSAnLi4vLi4vYXNzZXRzL2ljb25zL2dpdGh1Yl9tYXJrL2dpdGh1Yi1tYXJrLXdoaXRlLnN2Zyc7XG5pbXBvcnQgbGlua2VkaW5JY29uIGZyb20gJy4uLy4uL2Fzc2V0cy9pY29ucy9saW5rZWRpbl9tYXJrL2xpbmtlZGluXzAwLnN2Zyc7XG5pbXBvcnQgeEljb24gZnJvbSAnLi4vLi4vYXNzZXRzL2ljb25zL3hfbWFyay94XzAxLnN2Zyc7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgZWxlbWVudDogJ3VsJyxcbiAgYXR0cmlidXRlczoge1xuICAgIGNsYXNzOiAnc29jaWFscycsXG4gIH0sXG4gIGNoaWxkcmVuOiBbXG4gICAge1xuICAgICAgZWxlbWVudDogJ2xpJyxcbiAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBlbGVtZW50OiAnYScsXG4gICAgICAgICAgYXR0cmlidXRlczoge1xuICAgICAgICAgICAgaHJlZjogJyMnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgY2hpbGRyZW46IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgZWxlbWVudDogJ2ltZycsXG4gICAgICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgICAgICBjbGFzczogJ2ljb24gaWNvbl9zb2NpYWwnLFxuICAgICAgICAgICAgICAgIHNyYzogZ2l0SHViSWNvbixcbiAgICAgICAgICAgICAgICBvbmxvYWQ6ICdTVkdJbmplY3QodGhpcyknLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgIGVsZW1lbnQ6ICdsaScsXG4gICAgICBjaGlsZHJlbjogW1xuICAgICAgICB7XG4gICAgICAgICAgZWxlbWVudDogJ2EnLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIGhyZWY6ICcjJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGVsZW1lbnQ6ICdpbWcnLFxuICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgY2xhc3M6ICdpY29uIGljb25fc29jaWFsJyxcbiAgICAgICAgICAgICAgICBzcmM6IGxpbmtlZGluSWNvbixcbiAgICAgICAgICAgICAgICBvbmxvYWQ6ICdTVkdJbmplY3QodGhpcyknLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgIGVsZW1lbnQ6ICdsaScsXG4gICAgICBjaGlsZHJlbjogW1xuICAgICAgICB7XG4gICAgICAgICAgZWxlbWVudDogJ2EnLFxuICAgICAgICAgIGF0dHJpYnV0ZXM6IHtcbiAgICAgICAgICAgIGhyZWY6ICcjJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIGNoaWxkcmVuOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGVsZW1lbnQ6ICdpbWcnLFxuICAgICAgICAgICAgICBhdHRyaWJ1dGVzOiB7XG4gICAgICAgICAgICAgICAgY2xhc3M6ICdpY29uIGljb25fc29jaWFsJyxcbiAgICAgICAgICAgICAgICBzcmM6IHhJY29uLFxuICAgICAgICAgICAgICAgIG9ubG9hZDogJ1NWR0luamVjdCh0aGlzKScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0sXG4gIF0sXG59O1xuIiwiaW1wb3J0IGNyZWF0ZUVsZW1lbnQgZnJvbSAnLi4vLi4vaGVscGVycy9jcmVhdGVFbGVtZW50JztcbmltcG9ydCBzb2NpYWxzQ29uZmlnIGZyb20gJy4vc29jaWFscy5jb25maWcnO1xuaW1wb3J0ICcuLi8uLi9zdHlsZXMvc29jaWFscy5jc3MnO1xuXG5leHBvcnQgZGVmYXVsdCAoKSA9PiB7XG4gIGNvbnN0IHNvY2lhbHMgPSB7XG4gICAgaW5pdCgpIHt9LFxuICAgIGNhY2hlRE9NKGVsZW1lbnQpIHt9LFxuICAgIGJpbmRFdmVudHMoKSB7fSxcbiAgICByZW5kZXIoKSB7XG4gICAgICBjb25zdCB7IGVsZW1lbnQsIGF0dHJpYnV0ZXMsIGNoaWxkcmVuIH0gPSBzb2NpYWxzQ29uZmlnO1xuICAgICAgY29uc3Qgc29jaWFscyA9IGNyZWF0ZUVsZW1lbnQoZWxlbWVudCwgYXR0cmlidXRlcyk7XG4gICAgICBzb2NpYWxzLnNldENoaWxkcmVuKGNoaWxkcmVuKTtcbiAgICAgIHJldHVybiBzb2NpYWxzO1xuICAgIH0sXG4gIH07XG5cbiAgcmV0dXJuIHNvY2lhbHMucmVuZGVyKCk7XG59O1xuIiwiY29uc3QgQnVpbGRFbGVtZW50ID0gKHN0YXRlKSA9PiAoe1xuICBzZXRBdHRyaWJ1dGVzOiAoYXR0cmlidXRlcykgPT4ge1xuICAgIE9iamVjdC5lbnRyaWVzKGF0dHJpYnV0ZXMpLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgaWYgKGtleSAhPT0gJ3RleHRDb250ZW50Jykge1xuICAgICAgICBpZiAoa2V5ID09PSAnY2xhc3MnKSB7XG4gICAgICAgICAgc3RhdGUuc2V0Q2xhc3NOYW1lKHZhbHVlLnNwbGl0KC9cXHMvKSk7XG4gICAgICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnc3R5bGUnKSB7XG4gICAgICAgICAgc3RhdGUuc2V0U3R5bGUodmFsdWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0YXRlLnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUuc2V0VGV4dENvbnRlbnQodmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICB9LFxuICBzZXRTdHlsZTogKHRleHQpID0+IHtcbiAgICBzdGF0ZS5zdHlsZS5jc3NUZXh0ID0gdGV4dDtcbiAgfSxcbiAgc2V0SUQ6IChpZCkgPT4ge1xuICAgIHN0YXRlLmlkID0gaWQ7XG4gIH0sXG4gIHNldENsYXNzTmFtZTogKGFyckNsYXNzKSA9PiB7XG4gICAgYXJyQ2xhc3MuZm9yRWFjaCgoY2xhc3NOYW1lKSA9PiBzdGF0ZS5jbGFzc0xpc3QuYWRkKGNsYXNzTmFtZSkpO1xuICB9LFxuICBzZXRUZXh0Q29udGVudDogKHRleHQpID0+IHtcbiAgICBzdGF0ZS50ZXh0Q29udGVudCA9IHRleHQ7XG4gIH0sXG4gIHNldENoaWxkcmVuOiAoY2hpbGRyZW4pID0+IHtcbiAgICBjaGlsZHJlbi5mb3JFYWNoKChjaGlsZCkgPT4ge1xuICAgICAgaWYgKGNoaWxkIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgc3RhdGUuYXBwZW5kQ2hpbGQoY2hpbGQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY2hpbGRFbGVtZW50ID0gY3JlYXRlRWxlbWVudChjaGlsZC5lbGVtZW50KTtcbiAgICAgICAgaWYgKGNoaWxkLmF0dHJpYnV0ZXMgJiYgY2hpbGQuYXR0cmlidXRlcy5jb25zdHJ1Y3Rvci5uYW1lID09PSAnT2JqZWN0Jykge1xuICAgICAgICAgIGNoaWxkRWxlbWVudC5zZXRBdHRyaWJ1dGVzKGNoaWxkLmF0dHJpYnV0ZXMpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjaGlsZC5jaGlsZHJlbikge1xuICAgICAgICAgIGNoaWxkRWxlbWVudC5zZXRDaGlsZHJlbihjaGlsZC5jaGlsZHJlbik7XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGUuYXBwZW5kQ2hpbGQoY2hpbGRFbGVtZW50KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSxcbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50KHRhZ05hbWUsIGF0dHJpYnV0ZXMpIHtcbiAgY29uc3QgaHRtbEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xuICBPYmplY3QuYXNzaWduKGh0bWxFbGVtZW50LCBCdWlsZEVsZW1lbnQoaHRtbEVsZW1lbnQpKTtcbiAgaWYgKGF0dHJpYnV0ZXMpIGh0bWxFbGVtZW50LnNldEF0dHJpYnV0ZXMoYXR0cmlidXRlcyk7XG4gIHJldHVybiBodG1sRWxlbWVudDtcbn1cbiIsImV4cG9ydCBkZWZhdWx0IHtcbiAgc3Vic2NyaWJlcnM6IHt9LFxuICBzdWJzY3JpYmUoc3Vic2NyaWJlciwgZm4pIHtcbiAgICB0aGlzLnN1YnNjcmliZXJzW3N1YnNjcmliZXJdID0gdGhpcy5zdWJzY3JpYmVyc1tzdWJzY3JpYmVyXSB8fCBbXTtcbiAgICBpZiAoIXRoaXMuc3Vic2NyaWJlcnNbc3Vic2NyaWJlcl0uc29tZSgoaGFuZGxlcikgPT4gaGFuZGxlci5uYW1lID09PSBmbi5uYW1lKSkge1xuICAgICAgdGhpcy5zdWJzY3JpYmVyc1tzdWJzY3JpYmVyXS5wdXNoKGZuKTtcbiAgICB9XG4gIH0sXG4gIHVuc3Vic2NyaWJlKHN1YnNjcmliZXIsIGZuKSB7XG4gICAgaWYgKHRoaXMuc3Vic2NyaWJlcnNbc3Vic2NyaWJlcl0pIHtcbiAgICAgIHRoaXMuc3Vic2NyaWJlcnNbc3Vic2NyaWJlcl0uc3BsaWNlKHRoaXMuc3Vic2NyaWJlcnNbc3Vic2NyaWJlcl0uaW5kZXhPZihmbiksIDEpO1xuICAgICAgaWYgKHRoaXMuc3Vic2NyaWJlcnNbc3Vic2NyaWJlcl0ubGVuZ3RoID09PSAwKSBkZWxldGUgdGhpcy5zdWJzY3JpYmVyc1tzdWJzY3JpYmVyXTtcbiAgICB9XG4gIH0sXG4gIHB1Ymxpc2goc3Vic2NyaWJlciwgLi4uYXJncykge1xuICAgIGlmICh0aGlzLnN1YnNjcmliZXJzW3N1YnNjcmliZXJdKSB7XG4gICAgICB0aGlzLnN1YnNjcmliZXJzW3N1YnNjcmliZXJdLmZvckVhY2goKGZuKSA9PiBmbiguLi5hcmdzKSk7XG4gICAgfVxuICB9LFxufTtcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==