#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
void bucketSort(vector<float>& arr) {
    int n = arr.size();
    vector<vector<float>> buckets(n);
    for (int i = 0; i < n; i++) {
        int idx = n * arr[i];
        if (idx >= n) idx = n - 1;
        buckets[idx].push_back(arr[i]);
    }
    for (int i = 0; i < n; i++)
        sort(buckets[i].begin(), buckets[i].end());
    int index = 0;
    for (int i = 0; i < n; i++)
        for (size_t j = 0; j < buckets[i].size(); j++)
            arr[index++] = buckets[i][j];
}
int main() {
    int n;
    cout << "Enter number of elements: ";
    cin >> n;
    vector<float> arr(n);
    cout << "Enter " << n << " elements (between 0 and 1):\n";
    for (int i = 0; i < n; i++) {
        cin >> arr[i];
    }
    cout << "You entered: ";
    for (float num : arr)
        cout << num << " ";
    cout << endl;
    bucketSort(arr);
    cout << "Sorted result: ";
    for (float num : arr)
        cout << num << " ";
    cout << endl;
    return 0;
}