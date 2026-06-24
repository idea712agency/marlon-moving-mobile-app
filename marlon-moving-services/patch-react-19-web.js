const fs = require('fs');
const path = require('path');

const root = __dirname;

function patchFile(relativePath, replacements) {
  const filePath = path.join(root, relativePath);
  if (!fs.existsSync(filePath)) {
    return;
  }

  let source = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [from, to] of replacements) {
    if (source.includes(from)) {
      source = source.replace(from, to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, source);
  }
}

patchFile('node_modules/react-native-web/dist/exports/TouchableWithoutFeedback/index.js', [
  ['supportedProps.ref = useMergeRefs(forwardedRef, hostRef, element.ref);', 'supportedProps.ref = useMergeRefs(forwardedRef, hostRef, element.props.ref);'],
]);

patchFile('node_modules/react-native-web/src/exports/TouchableWithoutFeedback/index.js', [
  ['supportedProps.ref = useMergeRefs(forwardedRef, hostRef, element.ref);', 'supportedProps.ref = useMergeRefs(forwardedRef, hostRef, element.props.ref);'],
]);

patchFile('node_modules/expo-router/build/link/BaseExpoRouterLink.js', [
  [
    'const element = (<Component {...props} {...hrefAttrs} {...rest} style={style} {...react_native_1.Platform.select({',
    "const element = (<Component {...props} {...hrefAttrs} {...rest} style={react_native_1.Platform.OS === 'web' ? react_native_1.StyleSheet.flatten(style) : style} {...react_native_1.Platform.select({",
  ],
]);
