import pandas as pd
import gmplot
from os import path
import psycopg2
import os
import reverse_geocode
from geopy.geocoders import Nominatim
import threading
import folium
from folium.plugins import HeatMap
import ast


from IPython.display import display

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

# def make_heatmap_ghtorrent():
#     query='''
#     SELECT long, lat
#     FROM users
#     WHERE (long IS NOT NULL AND long != 0) AND lat IS NOT NULL
#     LIMIT 500000
#     '''

#     rows = run_query(query)
#     [longitudes, latitudes] = [[ i for i, j in rows ], [ j for i, j in rows ]]
#     gmap = gmplot.GoogleMapPlotter(34.0522, -118.2437, 0)
#     gmap.heatmap(latitudes, longitudes)
#     gmap.draw("user_heatmap.html")

def geocode(location, count, f):
    try:
        geolocator = Nominatim(timeout=100, user_agent='github_heatmap')
        location = geolocator.geocode(location)
        print(str([location, count, location.latitude, location.longitude]))
        f.write(str([location, count, location.latitude, location.longitude]) + '\n')
    except:
        pass


def get_coordinates():
    query='''
	SELECT location, COUNT(*) as count
	FROM github_users
	WHERE 
		(location IS NOT NULL and location !='null') AND
		LOWER(location) NOT LIKE '%india%' AND
		LOWER(location) NOT LIKE '%china%'
	GROUP BY location
	HAVING COUNT(*) > 100 AND COUNT(*) < 111
	ORDER BY count DESC
    '''

    rows = run_query(query)
    geolocator = Nominatim(timeout=100, user_agent='github_heatmap')

    f = open("coordinates.txt","a")
    for row in rows:
        thread = threading.Thread(target=geocode, args=(row[0], row[1], f,))
        thread.start()
        thread.join()
    f.close()

def get_coordinates_excluded():
    query='''
    SELECT location, COUNT(*) as count
    FROM github_users
    WHERE 
        (location IS NOT NULL and location !='null') AND
        LOWER(location) LIKE '%india%' OR
        LOWER(location) LIKE '%china%'
    GROUP BY location
    HAVING COUNT(*) > 100
    ORDER BY count DESC
    '''

    # rows = run_query(query)
    f = open("rows.txt", "r")
    rows = ast.literal_eval(f.read().strip())

    geolocator = Nominatim(timeout=100, user_agent='github_heatmap')

    f = open("coordinates_excluded.txt","a")
    for row in rows:
        thread = threading.Thread(target=geocode, args=(row[0], row[1], f,))
        thread.start()
        thread.join()
    f.close()


def make_heatmap():
    f = open("coordinates.txt", "r")
    lines = f.readlines()
    grid = []
    for line in lines:
        grid.append(line.strip().split(', ')[-3:])
    grid = [ [float(j), float(k[:-1]), int(i)] for i, j, k in grid ]
    print(grid)
    hmap = folium.Map(location=[0.0, 0.0], zoom_start=3)
    hm_wide = HeatMap(grid,
                   min_opacity=0.2,
                   max_val=38000,
                   radius=17, blur=15, 
                   max_zoom=1, 
                 )
    hmap.add_child(hm_wide)
    hmap.save('heatmap.html')

def make_heatmap_ghtorrent():
    query='''
    SELECT lat, long, COUNT(*) as count
    FROM users
    WHERE 
        (location IS NOT NULL and location !='null')
        AND (lat != 0 AND long != 0)
    GROUP BY lat, long
    HAVING COUNT(*) > 10
    ORDER BY count DESC
    '''

    rows = run_query(query)
    grid = [ list(row) for row in rows ]
    hmap = folium.Map(location=[0.0, 0.0], zoom_start=3)
    hm_wide = HeatMap(grid,
                   min_opacity=0.2,
                   max_val=38000,
                   radius=17, blur=15, 
                   max_zoom=1, 
                 )
    hmap.add_child(hm_wide)
    hmap.save('heatmap_ghtorrent.html')


if __name__ == '__main__':
  make_heatmap_ghtorrent()
