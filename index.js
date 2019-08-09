import React, {Component} from "react";
import {View} from 'react-native';
import PropTypes from 'prop-types'
import xmldom from 'xmldom';
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';

import Svg,{
    Circle,
    Ellipse,
    G ,
    LinearGradient,
    RadialGradient,
    Line,
    Path,
    Polygon,
    Polyline,
    Rect,
    Text,
    TSpan,
    Defs,
    Stop
} from 'react-native-svg';

import * as utils from './utils';

const ACCEPTED_SVG_ELEMENTS = [
  'svg',
  'g',
  'circle',
  'path',
  'rect',
  'defs',
  'line',
  'linearGradient',
  'radialGradient',
  'stop',
  'ellipse',
  'polygon',
  'polyline',
  'text',
  'tspan', 
  'style'
];

// Attributes from SVG elements that are mapped directly.
const SVG_ATTS = ['viewBox', 'width', 'height'];
const G_ATTS = ['id'];
const CIRCLE_ATTS = ['cx', 'cy', 'r'];
const PATH_ATTS = ['d'];
const RECT_ATTS = ['width', 'height'];
const LINE_ATTS = ['x1', 'y1', 'x2', 'y2'];
const LINEARG_ATTS = LINE_ATTS.concat(['id', 'gradientUnits']);
const RADIALG_ATTS = CIRCLE_ATTS.concat(['id', 'gradientUnits']);
const STOP_ATTS = ['offset'];
const ELLIPSE_ATTS = ['cx', 'cy', 'rx', 'ry'];

const TEXT_ATTS = ['fontFamily', 'fontSize', 'fontWeight', 'textAnchor']

const POLYGON_ATTS = ['points'];
const POLYLINE_ATTS = ['points'];

const COMMON_ATTS = ['fill', 'fillOpacity', 'stroke', 'strokeWidth', 'strokeOpacity', 'opacity',
    'strokeLinecap', 'strokeLinejoin',
    'strokeDasharray', 'strokeDashoffset', 'x', 'y', 'rotate', 'scale', 'origin', 'originX', 'originY', 'transform', 'clipPath'];

let ind = 0;

function fixYPosition (y, node) {
  if (node.attributes) {
    const fontSizeAttr = Object.keys(node.attributes).find(a => node.attributes[a].name === 'font-size');
    if (fontSizeAttr) {
      return '' + (parseFloat(y) - parseFloat(node.attributes[fontSizeAttr].value));
    }
  }
  if (!node.parentNode) {
    return y;
  }
  return fixYPosition(y, node.parentNode)
}

class SvgUri extends Component{

  constructor(props){
    super(props);

    this.state = {fill: props.fill, svgXmlData: props.svgXmlData};

    this.createSVGElement     = this.createSVGElement.bind(this);
    this.obtainComponentAtts  = this.obtainComponentAtts.bind(this);
    this.inspectNode          = this.inspectNode.bind(this);
    this.fetchSVGData         = this.fetchSVGData.bind(this);

    this.isComponentMounted   = false;

    // Gets the image data from an URL or a static file
    if (props.source) {
      const source = resolveAssetSource(props.source) || {};
      this.fetchSVGData(source.uri);
    }
  }

  componentWillMount() {
    this.isComponentMounted = true;
  }

  componentWillReceiveProps (nextProps){
    console.log("HI DU")

    if (nextProps.source) {
      const source = resolveAssetSource(nextProps.source) || {};
      const oldSource = resolveAssetSource(this.props.source) || {};
      if(source.uri !== oldSource.uri){
        this.fetchSVGData(source.uri);
      }
    }

    if (nextProps.svgXmlData !== this.props.svgXmlData) {
      this.setState({ svgXmlData: nextProps.svgXmlData });
    }

    if (nextProps.fill !== this.props.fill) {
      this.setState({ fill: nextProps.fill });
    }
  }

  componentWillUnmount() {
    this.isComponentMounted = false
  }

  async fetchSVGData(uri) {
    let responseXML = null, error = null;
    try {
      const response = await fetch(uri);
      responseXML = await response.text();
    } catch(e) {
      error = e;
      console.error("ERROR SVG", e);
    } finally {
      if (this.isComponentMounted) {
        this.setState({ svgXmlData: responseXML }, () => {
          const { onLoad } = this.props;
          if (onLoad && !error) {
            onLoad();
          }
        });
      }
    }

    return responseXML;
  }

  // Remove empty strings from children array
  trimElementChilden(children) {
    for (child of children) {
      if (typeof child === 'string') { 
        if (child.trim().length === 0) 
          children.splice(children.indexOf(child), 1);
      }
    }
  }

  createSVGElement(node, childs){
    this.trimElementChilden(childs);
    let componentAtts = {};
    let style = []
    const styleDict = {}
    const i = ind++;
    switch (node.nodeName) {
    case 'style': 
      style = node.firstChild.data.split(".").map(x => x.replace(";}", "").split("{"));
      style.forEach(element => {
        console.log(element)
          element && element[0] !== "" ? styleDict[element[0]] = element[1] : null
      });
      console.log("STYLE", styleDict)
    case 'svg':
      componentAtts = this.obtainComponentAtts(node, styleDict, SVG_ATTS);
      if (this.props.width) {
        componentAtts.width = this.props.width;
      }
      if (this.props.height) {
        componentAtts.height = this.props.height;
      }

      return <Svg key={i} {...componentAtts}>{childs}</Svg>;
    case 'g':
      componentAtts = this.obtainComponentAtts(node, styleDict, G_ATTS);
      console.log("COMP", componentAtts)

      return <G key={i} {...componentAtts}>{childs}</G>;
    case 'path':
      componentAtts = this.obtainComponentAtts(node, styleDict, PATH_ATTS);
      console.log("COMP", componentAtts)

      return <Path key={i} {...componentAtts}>{childs}</Path>;
    case 'circle':
      componentAtts = this.obtainComponentAtts(node, styleDict, CIRCLE_ATTS);
      return <Circle key={i} {...componentAtts}>{childs}</Circle>;
    case 'rect':
      componentAtts = this.obtainComponentAtts(node, styleDict, RECT_ATTS);
      return <Rect key={i} {...componentAtts}>{childs}</Rect>;
    case 'line':
      componentAtts = this.obtainComponentAtts(node, styleDict, LINE_ATTS);
      return <Line key={i} {...componentAtts}>{childs}</Line>;
    case 'defs':
      return <Defs key={i}>{childs}</Defs>;
    case 'linearGradient':
      componentAtts = this.obtainComponentAtts(node, styleDict, LINEARG_ATTS);
      return <LinearGradient key={i} {...componentAtts}>{childs}</LinearGradient>;
    case 'radialGradient':
      componentAtts = this.obtainComponentAtts(node, styleDict, RADIALG_ATTS);
      return <RadialGradient key={i} {...componentAtts}>{childs}</RadialGradient>;
    case 'stop':
      componentAtts = this.obtainComponentAtts(node, styleDict, STOP_ATTS);
      return <Stop key={i} {...componentAtts}>{childs}</Stop>;
    case 'ellipse':
      componentAtts = this.obtainComponentAtts(node, styleDict, ELLIPSE_ATTS);
      return <Ellipse key={i} {...componentAtts}>{childs}</Ellipse>;
    case 'polygon':
      componentAtts = this.obtainComponentAtts(node, styleDict, POLYGON_ATTS);
      return <Polygon key={i} {...componentAtts}>{childs}</Polygon>;
    case 'polyline':
      componentAtts = this.obtainComponentAtts(node, styleDict, POLYLINE_ATTS);
      return <Polyline key={i} {...componentAtts}>{childs}</Polyline>;
    case 'text':
      componentAtts = this.obtainComponentAtts(node, styleDict, TEXT_ATTS);
      return <Text key={i} {...componentAtts}>{childs}</Text>;
    case 'tspan':
      componentAtts = this.obtainComponentAtts(node, styleDict, styleDict, TEXT_ATTS);
      if (componentAtts.y) {
        componentAtts.y = fixYPosition(componentAtts.y, node)
      }
      return <TSpan key={i} {...componentAtts}>{childs}</TSpan>;
    default:
      return null;
    }
  }

  obtainComponentAtts({attributes}, styleDict, enabledAttributes) {
    const styleAtts = {};
    const externalStyleAtts = {};
    if (this.state.fill && this.props.fillAll) {
      styleAtts.fill = this.state.fill;
    }
    
    console.log("STYLEDICT", styleDict)
    Array.from(attributes).forEach(({nodeName, nodeValue}) => {
      console.log("NODENAME:", nodeName, "Must be class")
      if (nodeName === 'class'){
        console.log("NODEVALUE", nodeValue, "Must be className")
        if(styleDict.hasOwnProperty(nodeValue)){
          console.log("HELLO I'm Assigning!")
          Object.assign(externalStyleAtts, {
            fill: "\"" + styleDict[nodeValue] + "\""
          })
        }
        console.log("ExternalStyleAtts:", externalStyleAtts)
      }
      Object.assign(styleAtts, utils.transformStyle({
        nodeName,
        nodeValue,
        fillProp: this.state.fill
      }));
    });

     const componentAtts =  Array.from(attributes)
      .map(utils.camelCaseNodeName)
      .map(utils.removePixelsFromNodeValue)
      .filter(utils.getEnabledAttributes(enabledAttributes.concat(COMMON_ATTS)))
      .reduce((acc, {nodeName, nodeValue}) => {
        acc[nodeName] = (this.state.fill && nodeName === 'fill' && nodeValue !== 'none') ? this.state.fill : nodeValue
        return acc
      }, {});
    Object.assign(componentAtts, styleAtts, externalStyleAtts);

    return componentAtts;
  }

  inspectNode(node){
    // Only process accepted elements
    if (!ACCEPTED_SVG_ELEMENTS.includes(node.nodeName)) {
      return (<View />);
    }

    // Process the xml node
    const arrayElements = [];
    

    // if have children process them.
    // Recursive function.
    if (node.childNodes && node.childNodes.length > 0){
        for (let i = 0; i < node.childNodes.length; i++){
          const isTextValue = node.childNodes[i].nodeValue
          if (isTextValue) {
            arrayElements.push(node.childNodes[i].nodeValue)
          } else {
            const nodo = this.inspectNode(node.childNodes[i]);
            if (nodo != null) {
              arrayElements.push(nodo);
            }
          }
        }
    }

    return this.createSVGElement(node, arrayElements);
  }

  render () {
    try {
      if (this.state.svgXmlData == null) {
        return null;
      }

      const inputSVG = this.state.svgXmlData.substring(
        this.state.svgXmlData.indexOf("<svg "),
        (this.state.svgXmlData.indexOf("</svg>") + 6)
      ).replace(/<!-(.*?)->/g, '');

      const doc = new xmldom.DOMParser().parseFromString(inputSVG);

      const rootSVG = this.inspectNode(doc.childNodes[0]);

      return(
          <View style={this.props.style}>
            {rootSVG}
          </View>
      );
    } catch(e){
      console.error("ERROR SVG", e);
      return null;
    }
  }
}

SvgUri.propTypes = {
  style: PropTypes.object,
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  svgXmlData: PropTypes.string,
  source: PropTypes.any,
  fill: PropTypes.string,
  onLoad: PropTypes.func,
  fillAll: PropTypes.bool
}

module.exports = SvgUri;
