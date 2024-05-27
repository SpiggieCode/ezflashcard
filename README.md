<html>
  <body>
    <img src="https://github.com/SpiggieCode/ezflashcard/blob/main/ezflashcard.png?raw=true" alt="EzFlashcard">
    <p>
      Try me <a href="https://spiggiecode.github.io/ezflashcard/?Dungeons%20and%20Dragons%20creator=Gary%20Gygax&Star%20Wars%20planet=Tatooine&Main%20character%20in%20Harry%20Potter=Harry%20Potter&Programming%20language%20C++%20creator=Bjarne%20Stroustrup&First%20avenger=Captain%20America&Language%20for%20iOS%20development=Swift&Main%20character%20in%20Lord%20of%20the%20Rings=Frodo%20Baggins&Virtual%20currency=Bitcoin&Protagonist%20in%20The%20Matrix=Neo&Protagonist%20in%20Halo%20series=Master%20Chief&Encryption%20algorithm=AES&Flying%20owl%20in%20Harry%20Potter=Hedwig&Programming%20language%20for%20web%20development=JavaScript&First%20person%20on%20the%20moon=Neil%20Armstrong&First%20book%20of%20The%20Lord%20of%20the%20Rings=The%20Fellowship%20of%20the%20Ring&Wizard%20school%20in%20Harry%20Potter=Hogwarts&Creator%20of%20Sherlock%20Holmes=Arthur%20Conan%20Doyle&Language%20for%20Android%20development=Java&Main%20character%20in%20Game%20of%20Thrones=Jon%20Snow&Highest%20level%20in%20Dungeons%20and%20Dragons=20">here!</a>
    </p>
    <hr>

<h4>About EzFlashcard</h4>
<p>
  EzFlashcard is a user-friendly, open-source tool designed to dynamically create flashcards using key=value parameters in the URL. Essentially, it functions like a REST API without a backend. The content is passed through the URL, and the application runs in the end user's browser.
  <br><br>
  I originally developed this to enable a custom language learning GPT to create flashcards, but this is just one of its many potential use cases.
</p>

<hr>

<h4>Features</h4>
<ul>
  <li><b>Automatically enable settings with flags:</b></li>
  <ul>
    <li><i>clickreveal=true</i></li>
    <ul>
      <li>Enables clicking on a card to reveal an answer, removes text input</li>
    </ul>
    <li><i>removecorrect=true</i></li>
    <ul>
      <li>After entering a correct answer, the card will be removed from the stack</li>
    </ul>
  </ul>
  <li><b>Shuffle button</b></li>
  <ul>
    <li>Clicking shuffle at the top of the page will reorder all cards currently on the page</li>
  </ul>
</ul>

<hr>

<h4>How to Use EzFlashcard</h4>
<p>
  Using EzFlashcard is simple and intuitive. Follow these steps to create and use your flashcards:
</p>
<ol>
  <li>
    <b>Prepare your content</b> <ul>Construct a URL with your flashcard data using the format key=value, where the key is the question and the value is the answer. Separate multiple flashcards with an ampersand (&).</ul>
  </li>
  <li>
    <b>Open the URL</b> <ul>Paste the constructed URL into your browser's address bar and hit enter. For example <a href="https://spiggiecode.github.io/ezflashcard/?What%20is%204%2B4%3F=8&Who%20created%20Dungeons%20%26%20Dragons%3F=Gary%20Gygax&What%20is%20the%20meaning%20to%20life%2C%20the%20universe%2C%20and%20everything%3F=42&clickreveal=true">this URL</a>.</li></ul>
  </li>
  <li>
    <b>Interact with your flashcards</b> <ul>You can click on each flashcard to reveal the answer if the <i>clickreveal=true</i> flag is enabled. Otherwise, type your answer in the input box and hit enter.</ul>
  </li>

</ol>

<hr>

<h4>Usage Tips</h4>
<ul>
  <li>Bookmarks can be used to save and easily access specific sets of flashcards.</li>
  <li>Always URL encode special characters in your questions and answers, else the symbols &, =, and ? will break the cards.
  <li>Programmatically generate URLs for large sets of flashcards to avoid manual entry.</li>
  <li>Share URLs with others as hyperlinks, or run the site in an iframe to avoid displaying lengthy URLs.</li>
  <li>There is no limit to the number of flashcards you can create.</li>
</ul>
  </body>
</html>
