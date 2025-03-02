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
                <li>clickreveal=true</li>
                <ul>
                    <li>Default mode, called Memorize in the UI</li>
                    <li>Sets card mode to click to flip, classic flip card style</li>
                </ul>
                <li>textinput=true</li>
                <ul>
                    <li>Quiz mode, called Test Yourself in the UI</li>
                    <li>Sets card mode to text input, users must type the answer and press enter to reveal</li>
                </ul>
                <li>studymode=true</li>
                <ul>
                    <li>Displays a single card with question and answer, clicking the card cycles through the stack</li>
                    <li>Note: The stack resets, so this mode is essentially infinite. A counter is shown to indicate
                        where you are in the stack.</li>
                </ul>
                <li>matchmode=true</li>
                <ul>
                    <li>Cards are placed face down, click two cards to find matches</li>
                </ul>
                </li>
                <li>removecorrect=true</li>
                <ul>
                    <li>After entering a correct answer, the card will be removed from the stack</li>
                </ul>
                <li>swapqa=true</li>
                <ul>
                    <li>This will swap the question and answer sides of the cards, question1=answer1 becomes
                        answer1=question1.</li>
                    <li>This only applies to memorize and test yourself modes (click reveal and text input)</li>
                </ul>
                <li>hidemenu=true</li>
                <ul>
                    <li>Disables the settings menu, useful if you are running EzFlashcard in an iframe and want to
                        prevent users from changing options</li>
                </ul>
                <li>darkmode=true</li>
                <ul>
                    <li>Applies a dark theme to the application</li>
                </ul>
            
</ul>
<h4>Additional Features:</h4>
<ul>
              <li>Limit cards</li>
            <ul>
                <li>Limits the number of cards in the play area, default is 10 but this can be changd in the menu
                </li>
                <li>If used in combination with remove correct, it will refill the board with available cards to
                    maintain the specified number.</li>
                <li>This does not have a URL flag yet, its only an in-app option</li>
            </ul>
            <li>Generate URL with CSV</li>
            <ul>
                <li>Click the import button and select a URL, an ezflashcard link will be generated that you can copy or open.</li>
                <li>Note: The import checks only columns A and B. Column A should be questions, B answers.</li>
                <li>Row 1 is reserved for column titles.</li>
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
        <b>Add optional parameters</b> <ul>Add optional parameters, such as setting the card mode and configuring settings to be enabled on launch.</ul>
    </li>
  <li>
    <b>Open the URL</b> <ul>Paste the constructed URL into your browser's address bar and hit enter. For example <a href="https://spiggiecode.github.io/ezflashcard/?What%20is%204%2B4%3F=8&Who%20created%20Dungeons%20%26%20Dragons%3F=Gary%20Gygax&What%20is%20the%20meaning%20to%20life%2C%20the%20universe%2C%20and%20everything%3F=42&clickreveal=true">this URL</a>.</ul>
  </li>
  <li>
    <b>Interact with your flashcards</b> <ul>Click cards to reveal the answer, or type your answer and press enter depending on your configuration.</ul>
  </li>

</ol>

<hr>

<h4>Usage Tips</h4>
<ul>
  <li>Always URL encode special characters in your questions and answers, else the symbols & and = will break the cards.
  <li>You may use \n without URL encoding to split questions or answers into multiple lines on the card.
  <li>Programmatically generate URLs for large sets of flashcards to avoid manual entry.</li>
  <li>Share URLs with others as hyperlinks, or run the site in an iframe to avoid displaying lengthy URLs.</li>
  <li>Bookmarks can be used to save and easily access specific sets of flashcards.</li>
  <li>There is no limit to the number of flashcards you can create.</li>
</ul>
  </body>
</html>

<hr>

<p>If you are a ChatGPT subsciber and have access to the GPT marketplace, you can use my <a href="https://chatgpt.com/g/g-OP3fFIA5g-ezflashcard-helper">custom GPT to generate flashcards.</a></p>
