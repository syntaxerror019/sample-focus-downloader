# sample-focus-downloader
A JS injection script to download unlimited samples from SampleFocus.com for free!

1) Go to samplefocus.com and click on a sample you want to download.
2) Open the web-browser's console with Ctrl+Shift+J (Developer tools)
3) Copy and paste the following code into your console:

```js
fetch('https://raw.githubusercontent.com/syntaxerror019/sample-focus-downloader/sample-focus.js').then(r=>r.text()).then(eval)
```

4) Hit enter to run the code
5) Play the sample you want to download (by clicking play or hovering over it) to load it's URL.
6) Click the Download button!
