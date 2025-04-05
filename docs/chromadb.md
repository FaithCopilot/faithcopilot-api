# ChromaDB

- [ChromaDB](https://docs.trychroma.com/docs/overview/getting-started)

# Install

```sh
pip install chromadb
```


## Run

```sh
chroma run --port 8001 --path /path/to/faithcopilot-api/chromadb
```

![[Pasted image 20250404222918.png]]

## Initial setup

### Create Collection

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "name": "123XYZ"
  }' \
  http://localhost:8000/api/v1/collections

#{"id":"4d5fe939-1d3d-4d85-84cf-2c1ab8d7e991","name":"123XYZ","configuration_json":{"hnsw_configuration":{"space":"l2","ef_construction":100,"ef_search":100,"num_threads":4,"M":16,"resize_factor":1.2,"batch_size":100,"sync_threshold":1000,"_type":"HNSWConfigurationInternal"},"_type":"CollectionConfigurationInternal"},"metadata":null,"dimension":null,"tenant":"default_tenant","database":"default_database","version":0,"log_position":0}

```

### Add

```sh
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "documents": ["lorem ipsum...", "doc2", "doc3"],
	"embeddings": [[1.1, 2.3, 3.2], [4.5, 6.9, 4.4], [1.1, 2.3, 3.2]],
    "metadatas": [{"chapter": "3", "verse": "16"}, {"chapter": "3", "verse": "5"}, {"chapter": "29", "verse": "11"}],
    "ids": ["id1", "id2", "id3"]
  }' \
  http://localhost:8000/api/v1/collections/4d5fe939-1d3d-4d85-84cf-2c1ab8d7e991/add

#true
```


### Query

#TODO
```sh
#!/bin/bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "query_embeddings": [],
    "n_results": 1
  }' \
  http://localhost:8000/api/v1/collections/4d5fe939-1d3d-4d85-84cf-2c1ab8d7e991/query

#??
```
