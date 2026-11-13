import React from 'react';
import { WebView } from 'react-native-webview';
import { wrapHtml } from '../utils/recipeHtml';

export default function RecipeHtml({ html }) {
  return <WebView originWhitelist={['*']} source={{ html: wrapHtml(html) }} style={{ flex: 1 }} />;
}
