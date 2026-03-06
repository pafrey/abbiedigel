import {defineType, defineField, defineArrayMember} from 'sanity'
import {BookIcon} from '@sanity/icons'

export const book = defineType({
  name: 'book',
  title: 'Book',
  type: 'document',
  icon: BookIcon,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'ageRange',
      title: 'Age Range',
      type: 'string',
      options: {
        list: ['0–2', '2–4', '4–6', '6–8', '8–12'],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'themes',
      title: 'Themes',
      description: 'e.g. nature, friendship, loss, curiosity',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'description',
      title: 'Description / Why I Love It',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'libraryNote',
      title: 'Library Note',
      description: 'e.g. "Available at most Jefferson County branches"',
      type: 'string',
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'author', media: 'coverImage'},
  },
})
