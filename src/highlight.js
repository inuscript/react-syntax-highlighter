import React from 'react';


function createStyleObject(classNames, style) {
  return classNames.reduce((styleObject, className) => {
    return {...styleObject, ...style[className]};
  }, {});
}

function createClassNameString(classNames) {
  return classNames.join(' ');
}

function createChildren(style, useInlineStyles) {
  let childrenCount = 0;
  return children => {
    childrenCount += 1;
    return children.map((child, i) => createElement({
      node: child,
      style,
      useInlineStyles,
      key:`code-segment-${childrenCount}-${i}`
    }));
  }
}

function createElement({ node, style, useInlineStyles, key }) {
  const { properties, type, tagName, value } = node;
  if (type === 'text') {
    return value;
  } else if (tagName) {
    const TagName = tagName;
    const childrenCreator = createChildren(style, useInlineStyles);
    const props = (
      useInlineStyles
      ?
      { style: createStyleObject(properties.className || [], style) }
      :
      { className: createClassNameString(properties.className || []) }
    );
    const children = childrenCreator(node.children);
    return <TagName key={key} {...props}>{children}</TagName>;
  }
}

function getLineNumbers({ lines, startingLineNumber, style }) {
  return lines.map((_, i) => {
    const number = i + startingLineNumber;
    return (
      <span 
        key={`line-${i}`}
        className='react-syntax-highlighter-line-number' 
        style={typeof style === 'function' ? style(number) : style}
      >
        {`${number}\n`}
      </span> 
    );
  });
}

function LineNumbers({ 
  codeString, 
  containerStyle = {float: 'left', paddingRight: '10px'}, 
  numberStyle = {},
  startingLineNumber 
}) {
  return (
    <code style={containerStyle}>
      {getLineNumbers({
        lines: codeString.replace(/\n$/, '').split('\n'), 
        style: numberStyle,
        startingLineNumber
      })}
    </code>
  );
}

export default function (lowlight, defaultStyle) {
 return function SyntaxHighlighter(props) {
    const {
      language,
      children,
      style = defaultStyle,
      customStyle = {},
      codeTagProps = {},
      useInlineStyles = true,
      showLineNumbers = false,
      startingLineNumber = 1,
      lineNumberContainerStyle,
      lineNumberStyle,
      ...rest
    } = props;
    const codeTree = language ? lowlight.highlight(language, children) : lowlight.highlightAuto(children);
    const defaultPreStyle = style.hljs || {backgroundColor: '#fff'};
    const preProps = (
      useInlineStyles
      ?
      Object.assign({}, rest, { style: Object.assign({}, defaultPreStyle, customStyle) })
      :
      Object.assign({}, rest, { className: 'hljs'})
    );
    const childrenWithLineBreakIndexes = codeTree.value.reduce((lineBreakIndexes, node, i) => {
      if (node.type === 'text' && node.value.includes('\n')) {
        lineBreakIndexes.push(i);
      }
      else if(node.children) {
        node.children.forEach(childNode => {
          if (childNode.type === 'text' && childNode.value.includes('\n')) {
            lineBreakIndexes.push(i);
          }
        })
      }
      return lineBreakIndexes;
    }, []);
    const newTree = childrenWithLineBreakIndexes.map((lineBreakIndex, i) => ({
      type: 'element',
      tagName: 'span',
      properties: {},
      children: codeTree.value.slice(
        childrenWithLineBreakIndexes[i - 1] && childrenWithLineBreakIndexes[i - 1] + 1 || 0, 
        lineBreakIndex + 1
      )
    }));
    const lineNumbers = (
      showLineNumbers
      ?
      <LineNumbers
        containerStyle={lineNumberContainerStyle}
        numberStyle={lineNumberStyle}
        startingLineNumber={startingLineNumber}
        codeString={children}
      />
      :
      null
    );
    return (
      <pre {...preProps}>
        {lineNumbers}
        <code {...codeTagProps}>
          {newTree.map((node, i) => createElement({
            node,
            style,
            useInlineStyles,
            key: `code-segement${i}`
          }))}
        </code>
      </pre>
    );
  }
}
