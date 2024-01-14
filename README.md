# Hack-or-Snooze

This project is a news-aggregator site.  It allows users to create accounts, log in, create posts to articles, mark articles as favorites, edit one's own posts, and delete one's own posts.  It utilizes the Springboard-created hack-or-snooze API to store data.

There are 3 lists of story posts that can be displayed: all stories, the current user's favorites, and the current user's created stories.  Each story post contains the title, author, and URL of the article, as well as who posted it on Hack-or-Snooze.

All interactions, such as creating a new post, favoriting, editing, and deleting, will contact the API.  API requests are kept to a minimum, so only reloading the webpage will fetch a (limited) list of all stories.  Info on the webpage is occasionally synchronized with the online database whenever API responses send back story info.

Not all of the extra features have been implemented, due to time.  Desired features to implement include allowing users to change name or password, allowing users to delete their account, better presentation on mobile devices, and infinite scrolling.

---

Tools used:
* HTML5
* CSS3
* JavaScript ECMAScript 2018
* JQuery 3.7.1
* Axios 1.6.5
