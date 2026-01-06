import type { MoneyBook } from '~/types/models'

export const useMoneyBooks = () => {
  const { getToken } = useAuth()
  
  // Global state - shared across components
  const books = useState<MoneyBook[]>('money-books', () => [])
  const selectedBook = useState<MoneyBook | null>('selected-book', () => null)
  const loading = useState<boolean>('money-books-loading', () => false)
  const creating = useState<boolean>('money-books-creating', () => false)

  // Load all books
  async function loadBooks() {
    loading.value = true
    try {
      const token = await getToken.value()
      if (!token) return

      const data = await $fetch<MoneyBook[]>('/api/money-books', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      books.value = data

      // Auto-select first book if none selected
      if (!selectedBook.value && data.length > 0) {
        selectedBook.value = data[0] || null
      }
    } catch (error) {
      console.error('Failed to load books:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // Select a book
  function selectBook(book: MoneyBook) {
    selectedBook.value = book
  }

  // Create book
  async function createBook(name: string) {
    creating.value = true
    try {
      const token = await getToken.value()
      if (!token) return null

      const newBook = await $fetch<MoneyBook>('/api/money-books', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: { name }
      })

      books.value.unshift(newBook)
      selectedBook.value = newBook
      return newBook
    } catch (error) {
      console.error('Failed to create book:', error)
      throw error
    } finally {
      creating.value = false
    }
  }

  // Update book
  async function updateBook(bookId: string, name: string) {
    try {
      const token = await getToken.value()
      if (!token) return null

      const updatedBook = await $fetch<MoneyBook>(`/api/money-books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: { name }
      })

      const index = books.value.findIndex(b => b.id === bookId)
      if (index !== -1) {
        books.value[index] = updatedBook
        if (selectedBook.value?.id === bookId) {
          selectedBook.value = updatedBook
        }
      }
      return updatedBook
    } catch (error) {
      console.error('Failed to update book:', error)
      throw error
    }
  }

  // Delete book
  async function deleteBook(bookId: string) {
    try {
      const token = await getToken.value()
      if (!token) return false

      await $fetch(`/api/money-books/${bookId}`, {
        method: 'DELETE' as any,
        headers: { 'Authorization': `Bearer ${token}` }
      })

      books.value = books.value.filter(b => b.id !== bookId)
      
      // Auto-select first book if deleted book was selected
      if (selectedBook.value?.id === bookId) {
        selectedBook.value = books.value[0] || null
      }
      return true
    } catch (error) {
      console.error('Failed to delete book:', error)
      throw error
    }
  }

  // Reorder books
  async function reorderBooks(reorderedBooks: MoneyBook[]) {
    try {
      const token = await getToken.value()
      if (!token) return false

      books.value = reorderedBooks

      const bookIds = reorderedBooks.map(b => b.id)
      await $fetch('/api/money-books/reorder', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: { bookIds }
      })
      return true
    } catch (error) {
      console.error('Failed to reorder books:', error)
      await loadBooks() // Restore correct order
      throw error
    }
  }

  return {
    books,
    selectedBook,
    loading,
    creating,
    loadBooks,
    selectBook,
    createBook,
    updateBook,
    deleteBook,
    reorderBooks
  }
}
