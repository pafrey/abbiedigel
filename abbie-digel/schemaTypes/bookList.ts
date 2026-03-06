import {defineType, defineField, defineArrayMember} from 'sanity'
import {ThListIcon} from '@sanity/icons'

export const bookList = defineType({
  name: 'bookList',
  title: 'Book List',
  type: 'document',
  icon: ThListIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'List Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'List Description',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'books',
      title: 'Books',
      type: 'array',
      of: [defineArrayMember({type: 'reference', to: [{type: 'book'}]})],
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
    }),
  ],
  preview: {
    select: {title: 'title'},
  },
})
