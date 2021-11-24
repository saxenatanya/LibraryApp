const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const author = require('../models/author');
const Book = require('../models/book');
const uploadPath = path.join('public', Book.coverImageBasePath)
const imageMimeTypes = ['image/jpeg', 'image/png', 'images/gif']
const upload = multer({
  dest: uploadPath,
  fileFilter: (req, file, callback) => {
    callback(null, imageMimeTypes.includes(file.mimetype))
  }
})
const router = express.Router();

// gives all book route
router.get('/', async (req, res) => {
    let query= Book.find();
    if(req.query.title != null && req.query.title != ''){
        query = query.regex('title',new RegExp(req.query.title,'i'))
    }
    if(req.query.publishedBefore != null && req.query.publishedBefore != ''){
        query = query.lte('publishDate',req.query.publishedBefore)
    }
    if(req.query.publishedAfter != null && req.query.publishedAfter != ''){
        query = query.gte('publishDate',req.query.publishedAfter)
    }
try {
    const books = await query.exec();
    // const books = await Book.find({})
    res.render('books/index',{
        books:books,
        searchOptions:req.query
    })
} catch (error) {
    console.error(error);
res.redirect('/');
}

});

//new book route
router.get('/new', async (req, res) => {
    renderNewPage(res, new Book())
});


//create book route
router.post('/', upload.single('cover'), async (req, res) => {
    const fileName = req.file != null ? req.file.filename : null
  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate),
    pageCount: req.body.pageCount,
    coverImageName: fileName,
    description: req.body.description
  })
    try {
        const newBook = await book.save();
        res.redirect('books/${newBook:id}');
    } catch(error) {
        console.error(error);
        if(book.coberImageName != null){
            removeBookCover(book.coverImageName)
        }
        renderNewPage(res, book, true);
    }
});

    function removeBookCover(){
       fs.unlink(path.join(uploadPath,fileName), err =>{
           if(err) console.error(err);
       }) 
    }

async function renderNewPage(res, book, hasError = false) {
    renderFormPage(res,book,'new',false)


}

//show book route
router.get('/:id',async (req, res) => {
    try{
        const book  = await   Book.findById(req.params.id).populate('author').exec() //populate to get the all details of aithor along with book
        // const books= await Book.find({author:author.id}).limit(6).exec()
        res.render('books/show',{
            book  : book
        
        })
    }catch(e){
            res.redirect('/');
            console.error(e);
    }

});


//edit book route
router.get('/:id/edit', async (req, res) => {
    try{
        const book = await Book.findById(req.params.id)
        renderEditPage(res,  book)
    }catch{
       
    }
    
});

//update book route
router.put('/:id', async (req, res) => {
    try {
        book = await Book.findById(req.params.id)
        book.title = req.body.title
        book.author = req.body.author
        book.publishDate = new Date(req.body.publishDate)
        book.pageCount = req.body.pageCount
        book.description = req.body.description
        if (req.body.cover != null && req.body.cover !== '') {
          saveCover(book, req.body.cover)
        }
        await book.save()
        res.redirect(`/books/${book.id}`)
      } catch {
        if (book != null) {
          renderEditPage(res, book, true)
        } else {
          redirect('/')
        }
      }
});

//delete book page

router.delete('/:id', async(req, res) => {
    let book;
    try {
        book = await Book.findById(req.params.id);
        // author.name= req.body.name;
        await book.remove();
        res.redirect('/books')
    } catch {
        if(book == null){
            res.redirect('/')
        }else{
            res.render('books/show',{
                book:book,
                errorMessage : 'Could not remove the book'
            })
        }
       
    }
})

async function renderEditPage(res, book, hasError = false) {
    renderFormPage(res,book,'edit',false)

}
async function renderFormPage(res, book,form, hasError = false) {
    try {
        const authors = await author.find({});
        const params = {
            authors: authors,
            book: book
        }
        if (hasError){
            if(form === 'edit'){
                params.errorMessage = 'Error updating Book';
            }else{
                params.errorMessage = 'Error Creating Book';
            }
        } 

      
        // const book = new Book();
        res.render(`books/${form}`, params)
    } catch (error) {
        res.redirect('/books');
    }

}

function saveCover(book, coverEncoded) {
    if (coverEncoded == null) return
    const cover = JSON.parse(coverEncoded)
    if (cover != null && imageMimeTypes.includes(cover.type)) {
      book.coverImage = new Buffer.from(cover.data, 'base64')
      book.coverImageType = cover.type
    }
  }

module.exports = router;