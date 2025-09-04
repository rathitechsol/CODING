#include <iostream>
using namespace std;
void selectionSort(int arr[], int n) {
	for (int i = 0; i < n - 1; i++) {
		int minIndex = i;
		for (int j = i + 1; j < n; j++) {
			if (arr[j] < arr[minIndex])
				minIndex = j;
		}
		swap(arr[i], arr[minIndex]);
	}
}
void printArray(int arr[], int n) {
	for (int i = 0; i < n; i++)
		cout << arr[i] << " ";
}
int main() {
	int n;
	cout << "Enter the number of elements: ";
	cin >> n;
	int arr[100];
	cout << "Enter " << n << " elements: ";
	for (int i = 0; i < n; i++)
		cin >> arr[i];
	cout << "Original Array: ";
	printArray(arr, n);
	selectionSort(arr, n);
	cout << endl << "Sorted Array: ";
	printArray(arr, n);
	return 0;
}

