import psycopg2
import os
import datetime
import numpy as np
import ast
import matplotlib
import nltk
from nltk.corpus import stopwords
from matplotlib import pyplot as plt
from matplotlib import dates
from os import path
from wordcloud import WordCloud

def run_query(query):
  try:
      connection = psycopg2.connect(user = "",
                                    password = "",
                                    host = "",
                                    port = "5432",
                                    database = "")

      cursor = connection.cursor()
      cursor.execute(query)
      rows = cursor.fetchall()
      return rows
  except (Exception, psycopg2.Error) as error :
      print ("Error while connecting to PostgreSQL", error)
  finally:
      #closing database connection.
          if(connection):
              cursor.close()
              connection.close()
              print("PostgreSQL connection is closed")

def make_word_cloud(file_path):
  d = path.dirname(__file__) if "__file__" in locals() else os.getcwd()
  text = open(path.join(d, file_path)).read()

  frequencies = dict(ast.literal_eval(text))
  stop_words =  set(stopwords.words('english'))
  cleaned_frequencies = dict()
  for key in frequencies.keys():
    if key not in stop_words:
      cleaned_frequencies[key] = frequencies[key]


  # Generate a word cloud image
  wordcloud = WordCloud(width=1600, height=800).generate_from_frequencies(cleaned_frequencies)

  # Display the generated image:
  # the matplotlib way:
  plt.imshow(wordcloud, interpolation='bilinear')
  plt.axis("off")

  # # lower max_font_size
  # wordcloud = WordCloud(max_font_size=60, width=1600, height=800).generate_from_frequencies(cleaned_frequencies)
  # plt.figure()
  # plt.imshow(wordcloud, interpolation="bilinear")
  # plt.axis("off")
  plt.show()



def get_commit_comments_per_day():
  query='''
    SELECT 
      TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') as date,
      count(*) as count
    FROM commit_comments
    GROUP BY date;
  '''

  rows = run_query(query)
  unzipped_rows = [[ i for i, j in rows ], [ j for i, j in rows ]]
  print(unzipped_rows)

  converted_dates = list(map(datetime.datetime.strptime, unzipped_rows[0], len(unzipped_rows[0])*['%Y-%m-%d']))
  x_axis = converted_dates
  formatter = dates.DateFormatter('%Y-%m-%d')
  y_axis = unzipped_rows[1]

  plt.plot(x_axis, y_axis)
  plt.show()

def get_top_users_submitting_commit_comments():
  query='''
    SELECT user_id, COUNT(*) as count
    FROM commit_comments
    GROUP BY user_id
    ORDER BY count DESC
    LIMIT 10
  '''

  rows = run_query(query)

  fig, ax = plt.subplots()
  ax.xaxis.set_visible(False) 
  ax.yaxis.set_visible(False)
  clust_data = [list(i) for i in rows]
  print(clust_data)
  col_label=("user_id", "count")
  ax.table(cellText=clust_data, colLabels=col_label, loc='center')

  plt.show()

def get_most_common_project_languages():
  query='''
    SELECT language, COUNT(*) as count
    FROM projects
    GROUP BY language
    ORDER BY count DESC
    LIMIT 100
  '''

  rows = run_query(query)

  fig, ax = plt.subplots()
  ax.xaxis.set_visible(False) 
  ax.yaxis.set_visible(False)
  clust_data = [list(i) for i in rows]
  print(clust_data)
  col_label=("user_id", "count")
  ax.table(cellText=clust_data, colLabels=col_label, loc='center')

  plt.show()


def get_words():

  get_most_common_words_query = '''
    WITH stop_words(word) AS
    (

        VALUES ('the'), ('a'), ('and'), ('this')
    )
    , found_lower_words AS
    (
    SELECT 
        lower(unnest(string_to_array(bio, ' '))) AS word
    FROM
        github_users
    )

    SELECT
        word, count(*) AS word_count
    FROM
        found_lower_words
        LEFT JOIN stop_words USING(word)
    WHERE
        stop_words.word is NULL
    GROUP BY
        word
    ORDER BY
        word_count DESC, word ASC
    LIMIT
        5000;
  '''

  rows = run_query(get_most_common_words_query)
  print(rows)


def get_users_per_day():
  query='''
    SELECT 
      *
    FROM users_per_day
    WHERE to_date(date, 'YYYY-MM-DD') < to_date('2020-03-01', 'YYYY-MM-DD');
  '''

  rows = run_query(query)
  unzipped_rows = [[ i for i, j in rows ], [ j for i, j in rows ]]
  print(unzipped_rows)

  converted_dates = list(map(datetime.datetime.strptime, unzipped_rows[0], len(unzipped_rows[0])*['%Y-%m-%d']))
  x_axis = converted_dates
  formatter = dates.DateFormatter('%Y-%m-%d')
  y_axis = unzipped_rows[1]

  plt.plot(x_axis, y_axis)
  plt.show()

def get_top_companies():
  query='''
  SELECT company, COUNT(*) as count
  FROM users
  WHERE company is NOT NULL AND company != 'null'
  GROUP BY company
  ORDER BY count DESC
  LIMIT 5000  
'''

  rows = run_query(query)
  print(rows)

def get_email_domains():
  query='''
  select 
  substring(email from '@(.*)$') as domain, count(*)
  from github_users
  group by domain
  order by count desc
  limit 500
  '''

  rows = run_query(query)
  print(rows)

def get_top_level_domains():
  query='''
  select 
  substring("websiteURL" from '^[^:]*://(?:[^/:]*:[^/@]*@)?(?:[^/:.]*\.)+([^:/]+)') as tld, count(*) as count
  from github_users
  group by tld
  order by count desc
  limit 500
  '''

  rows = run_query(query)
  print(rows)

if __name__ == '__main__':
  make_word_cloud('data/5000_most_common_words_commit_comments.txt')
  # make_word_cloud('data/top_100_projects_by_language.txt')
  # make_word_cloud('data/top_500_email_domains.txt')
  # make_word_cloud('data/top_500_tlds.txt')
  # make_word_cloud('data/top_5000_bio_words.txt')
  # make_word_cloud('data/top_5000_companies_ghtorrent.txt')
  # make_word_cloud('data/top_5000_companies.txt')
  
