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
        list: ['babies', 'toddlers', 'pre-school', 'K-2', '3-5'],
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
      name: 'moment',
      title: 'Moment',
      description: 'e.g. bedtime, read-aloud, discussion',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
    defineField({
      name: 'whyILoveIt',
      title: 'Why I Love This Book',
      type: 'text',
      rows: 4,
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'author', media: 'coverImage'},
  },
})
