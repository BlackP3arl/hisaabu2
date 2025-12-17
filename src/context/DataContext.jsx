import { createContext, useContext, useState } from 'react'

const DataContext = createContext()

export const useData = () => useContext(DataContext)

export function DataProvider({ children }) {
  const [clients, setClients] = useState([
    { id: 1, name: 'Acme Corp', email: 'john@acme.com', phone: '+1 234 567 8900', address: 'San Francisco, CA', status: 'active', totalBilled: 12450 },
    { id: 2, name: 'Stark Industries', email: 'tony@stark.com', phone: '+1 234 567 8901', address: 'New York, NY', status: 'overdue', outstanding: 3400 },
    { id: 3, name: 'Wayne Ent.', email: 'bruce@wayne.com', phone: '+1 234 567 8902', address: 'Gotham City', status: 'new' },
    { id: 4, name: 'Cyberdyne Sys', email: 'sarah@cyberdyne.com', phone: '+1 234 567 8903', address: 'Los Angeles, CA', status: 'active', totalBilled: 8200 },
  ])

  const [categories, setCategories] = useState([
    { id: 1, name: 'Design Services', description: 'UI/UX, Graphics, Branding', color: '#3B82F6', itemCount: 4 },
    { id: 2, name: 'Development', description: 'Web, Mobile, API Development', color: '#10B981', itemCount: 5 },
    { id: 3, name: 'Consulting', description: 'Business & Technical Consulting', color: '#8B5CF6', itemCount: 2 },
    { id: 4, name: 'Marketing', description: 'Digital Marketing, SEO, Content', color: '#F59E0B', itemCount: 3 },
    { id: 5, name: 'Support', description: 'Technical Support & Maintenance', color: '#EF4444', itemCount: 2 },
  ])

  const [items, setItems] = useState([
    { id: 1, name: 'UI/UX Design', description: 'Complete user interface and experience design', rate: 150, categoryId: 1, categoryName: 'Design Services', status: 'active' },
    { id: 2, name: 'Logo Design', description: 'Professional logo and brand identity design', rate: 500, categoryId: 1, categoryName: 'Design Services', status: 'active' },
    { id: 3, name: 'Web Development', description: 'Full-stack web application development', rate: 120, categoryId: 2, categoryName: 'Development', status: 'active' },
    { id: 4, name: 'Mobile App Development', description: 'iOS and Android native app development', rate: 150, categoryId: 2, categoryName: 'Development', status: 'active' },
    { id: 5, name: 'API Integration', description: 'Third-party API integration services', rate: 100, categoryId: 2, categoryName: 'Development', status: 'active' },
    { id: 6, name: 'Business Consulting', description: 'Strategic business analysis and planning', rate: 200, categoryId: 3, categoryName: 'Consulting', status: 'active' },
    { id: 7, name: 'SEO Optimization', description: 'Search engine optimization services', rate: 80, categoryId: 4, categoryName: 'Marketing', status: 'active' },
    { id: 8, name: 'Content Writing', description: 'Professional content creation and copywriting', rate: 50, categoryId: 4, categoryName: 'Marketing', status: 'inactive' },
    { id: 9, name: 'Technical Support', description: 'Ongoing technical support and maintenance', rate: 75, categoryId: 5, categoryName: 'Support', status: 'active' },
    { id: 10, name: 'Graphic Design', description: 'Marketing materials and print design', rate: 90, categoryId: 1, categoryName: 'Design Services', status: 'active' },
  ])

  const [quotations, setQuotations] = useState([
    { id: 1, number: 'QT-2023-001', clientId: 1, clientName: 'Acme Corp', date: '2023-10-24', expiry: '2023-11-24', amount: 1250, status: 'accepted', items: [] },
    { id: 2, number: 'QT-2023-005', clientId: 2, clientName: 'Globex Inc.', date: '2023-10-22', expiry: '2023-11-22', amount: 3400, status: 'sent', items: [] },
    { id: 3, number: 'QT-2023-012', clientId: 2, clientName: 'Stark Ind', date: '2023-10-23', expiry: '2023-11-23', amount: 15000, status: 'draft', items: [] },
    { id: 4, number: 'QT-2023-003', clientId: 3, clientName: 'Wayne Ent.', date: '2023-09-15', expiry: '2023-10-15', amount: 8500, status: 'expired', items: [] },
    { id: 5, number: 'QT-2023-018', clientId: 4, clientName: 'Cyberdyne', date: '2023-10-24', expiry: '2023-11-24', amount: 42000, status: 'sent', items: [] },
  ])

  const [invoices, setInvoices] = useState([
    { id: 1, number: 'INV-0023', clientId: 1, clientName: 'Global Corp Ltd.', date: '2023-10-20', due: '2023-10-24', amount: 1250, status: 'paid', items: [] },
    { id: 2, number: 'INV-0024', clientId: 2, clientName: 'Acme Industries', date: '2023-10-15', due: '2023-10-30', amount: 4500, status: 'overdue', items: [] },
    { id: 3, number: 'INV-0025', clientId: 3, clientName: 'Design Studio', date: '2023-10-24', due: '2023-11-24', amount: 850, status: 'draft', items: [] },
    { id: 4, number: 'INV-0026', clientId: 4, clientName: 'Bright Web Sol.', date: '2023-10-10', due: '2023-11-15', amount: 3200, status: 'partial', paid: 2133, items: [] },
    { id: 5, number: 'INV-0022', clientId: 1, clientName: 'John Doe Personal', date: '2023-10-01', due: '2023-12-01', amount: 250, status: 'sent', items: [] },
  ])

  const [company] = useState({
    name: 'Your Company',
    logo: '',
    address: '123 Business St, City, Country',
    shippingAddress: '123 Business St, City, Country',
    gst: 'GST123456',
    registration: 'REG789012',
    phone: '+1 234 567 8900',
    email: 'info@company.com',
  })

  const [settings] = useState({
    defaultTax: 10,
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    invoicePrefix: 'INV-',
    quotationPrefix: 'QT-',
    terms: 'Payment due within 30 days.',
  })

  // Quotation CRUD
  const addQuotation = (quotation) => {
    const newQuotation = { ...quotation, id: quotations.length + 1 }
    setQuotations([...quotations, newQuotation])
    return newQuotation
  }

  const updateQuotation = (id, updates) => {
    setQuotations(quotations.map(q => q.id === id ? { ...q, ...updates } : q))
  }

  const deleteQuotation = (id) => {
    setQuotations(quotations.filter(q => q.id !== id))
  }

  // Invoice CRUD
  const addInvoice = (invoice) => {
    const newInvoice = { ...invoice, id: invoices.length + 1 }
    setInvoices([...invoices, newInvoice])
    return newInvoice
  }

  const updateInvoice = (id, updates) => {
    setInvoices(invoices.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  const deleteInvoice = (id) => {
    setInvoices(invoices.filter(i => i.id !== id))
  }

  // Client CRUD
  const addClient = (client) => {
    const newClient = { ...client, id: clients.length + 1 }
    setClients([...clients, newClient])
    return newClient
  }

  const updateClient = (id, updates) => {
    setClients(clients.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteClient = (id) => {
    setClients(clients.filter(c => c.id !== id))
  }

  // Category CRUD
  const addCategory = (category) => {
    const newCategory = { ...category, id: categories.length + 1, itemCount: 0 }
    setCategories([...categories, newCategory])
    return newCategory
  }

  const updateCategory = (id, updates) => {
    setCategories(categories.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteCategory = (id) => {
    setCategories(categories.filter(c => c.id !== id))
  }

  // Item CRUD
  const addItem = (item) => {
    const category = categories.find(c => c.id === item.categoryId)
    const newItem = { 
      ...item, 
      id: items.length + 1,
      categoryName: category?.name || ''
    }
    setItems([...items, newItem])
    // Update category item count
    if (category) {
      updateCategory(category.id, { itemCount: (category.itemCount || 0) + 1 })
    }
    return newItem
  }

  const updateItem = (id, updates) => {
    const category = updates.categoryId ? categories.find(c => c.id === updates.categoryId) : null
    if (category) {
      updates.categoryName = category.name
    }
    setItems(items.map(i => i.id === id ? { ...i, ...updates } : i))
  }

  const deleteItem = (id) => {
    const item = items.find(i => i.id === id)
    if (item) {
      const category = categories.find(c => c.id === item.categoryId)
      if (category && category.itemCount > 0) {
        updateCategory(category.id, { itemCount: category.itemCount - 1 })
      }
    }
    setItems(items.filter(i => i.id !== id))
  }

  return (
    <DataContext.Provider value={{
      clients,
      quotations,
      invoices,
      company,
      settings,
      categories,
      items,
      addQuotation,
      updateQuotation,
      deleteQuotation,
      addInvoice,
      updateInvoice,
      deleteInvoice,
      addClient,
      updateClient,
      deleteClient,
      addCategory,
      updateCategory,
      deleteCategory,
      addItem,
      updateItem,
      deleteItem,
    }}>
      {children}
    </DataContext.Provider>
  )
}
