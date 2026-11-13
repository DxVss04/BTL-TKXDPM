import React from 'react';
import { wrapHtml } from '../utils/recipeHtml';

// react-native-webview không có bản web. sandbox rỗng để HTML công thức không chạy được script.
export default function RecipeHtml({ html }) {
  return <iframe title="Nội dung công thức" sandbox="" srcDoc={wrapHtml(html)} style={{ flex: 1, width: '100%', border: 0 }} />;
}
