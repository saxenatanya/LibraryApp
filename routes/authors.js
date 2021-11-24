const express = require('express');
const Author = require('../models/author');
const Books = require('../models/book');
const router = express.Router();

// gives all authors route
router.get('/', async (req, res) => {
    let searchOptions = {}
    if (req.query.name != null && req.query.name !== '') {
        searchOptions.name = new RegExp(req.query.name, 'i');
    }
    try {
        const authors = await Author.find(searchOptions)
        res.render('authors/index', {
            authors: authors,
            searchOptions: req.query
        });
    } catch (error) {
        res.redirect('/');
    }


});

//new author route
router.get('/new', (req, res) => {
    res.render('authors/new', { author: new Author() });
});


//create author route
router.post('/', async (req, res) => {
    const author = new Author({
        name: req.body.name
    })
    try {
        const newAuthor = await author.save()
        res.redirect('/authors')
    } catch {
        res.render('authors/new', {
            author: author,
            errorMessage: "Error creating author"
        })
    }
});

router.get('/:id',async (req, res) => {
    try{
        const author  = await Author.findById(req.params.id)
        const books= await Books.find({author:author.id}).limit(6).exec()
        res.render('authors/show',{
            author: author,
            booksByAuthor :books
        })
    }catch(e){
            res.redirect('/');
            console.error(e);
    }

})

router.get('/:id/edit', async (req, res) => {
    try {
        const author = Author.findById(req.params.id)
        res.render('authors/edit', { author: author });
    } catch {
        res.send('/authors');
    }


});

router.put('/:id', async(req, res) => {
    let author
    try {
      author = await Author.findById(req.params.id)
      author.name = req.body.name
      await author.save()
      res.redirect(`/authors/${author.id}`)
    } catch (e){
      if (author == null) {
        res.redirect('/')
        console.log("author is null");

      } else {
        res.render('authors/edit', {
          author: author,
          errorMessage: 'Error updating Author'
        });
        console.log("author is not null in else");

      }
      console.error(e);
    }
});

router.delete('/:id', async(req, res) => {
    let author;
    try {
        author = await Author.findById(req.params.id);
        // author.name= req.body.name;
        await author.remove();
        res.redirect('/authors')
    } catch {
        if(author == null){
            res.redirect('/')
        }else{
            res.redirect(`/authors/${author.id}`);
        }
       
    }
})

module.exports = router;