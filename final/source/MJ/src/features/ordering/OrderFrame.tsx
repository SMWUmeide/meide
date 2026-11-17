import { forwardRef, useImperativeHandle, useRef } from 'react';
import { WebView } from 'react-native-webview';
import { isOrderNavigation, type OrderFrameHandle, type OrderFrameProps } from './protocol';
export const OrderFrame = forwardRef<OrderFrameHandle,OrderFrameProps>(function OrderFrame({html,onMessage}, ref) {
  const browser=useRef<WebView<object>>(null);
  useImperativeHandle(ref,()=>({send(message){browser.current?.injectJavaScript(`window.dispatchEvent(new MessageEvent('message',{data:${JSON.stringify(message)}}));true;`);}}),[]);
  return <WebView<object> ref={browser} source={{html,baseUrl:'https://localhost/'}} style={{flex:1,backgroundColor:'#F2F4F6'}} javaScriptEnabled domStorageEnabled allowFileAccess={false} mixedContentMode="never" setSupportMultipleWindows={false} originWhitelist={['https://localhost','about:blank']} onShouldStartLoadWithRequest={request=>isOrderNavigation(request.url)} onMessage={event=>onMessage(event.nativeEvent.data)} />;
});
